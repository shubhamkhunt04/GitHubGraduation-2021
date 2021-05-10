const { Octokit, App, Action } = require("octokit")
const actionEvent = require('./action-event.js');

class Octo {
  constructor() {
    this.octokit = new Octokit({ auth: process.env.GH_SECRET });
  }

  async getContent(path) {
    const { data }  = await this.octokit.rest.repos.getContent({
      mediaType: {
        format: "raw",
      },
      owner: actionEvent.pullRepoOwner,
      repo: actionEvent.pullRepo.name,
      path: path,
      ref: actionEvent.pull.head.sha
    });

    return data
  }

  async fetchPr(pr) {
    const { repository: { pullRequest } } = await this.octokit.graphql(
      `
        query myQuery($name: String!, $owner: String!, $pr: Int!){
          repository(name: $name, owner: $owner) {
            pullRequest(number: $pr) {
              author {
                login
              }
              bodyText
              closed
              reviews(first:100) {
                edges{
                  node {
                    body
                    state
                    url
                    author {
                      login
                    }

                    comments(first: 100) {
                      edges {
                        node {
                          body
                          author {
                            login
                          }
                        }
                      }
                    }
                  }
                }
              }

              files(first: 100) {
                edges {
                  node {
                    path
                    additions
                    deletions
                  }
                }
              }
            }
          }
        }
      `,
      {
        name: actionEvent.pullRepo.name,
        owner: actionEvent.pullRepoOwner,
        pr: pr
      }
    )
    return pullRequest
  }

  // comments are an array of objects:

  // path (string) Required. The relative path to the file that necessitates a review comment.
  // position (integer) The position in the diff where you want to add a review comment.
  //          Note this value is not the same as the line number in the file. For help finding
  //          the position value, read the note below.
  // body (string) Required. Text of the review comment.
  // line (integer)
  // side (string)
  // start_line (integer)
  // start_side (string)

  async createReview(content, event="COMMENT", comments=[]) {
    const { data }  = await this.octokit.rest.pulls.createReview({
      accept: "application/vnd.github.v3+json",
      pull_number: actionEvent.pullNumber,
      commit_id: actionEvent.pull.head.sha,
      owner: actionEvent.pullRepoOwner,
      repo: actionEvent.pullRepo.name,
      body: content,
      comments: comments,
      event: event
    });

    return data
  }
}

module.exports = new Octo()