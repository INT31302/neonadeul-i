module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      'semantic-release-heroku',
      {
        branches: ['main'],
        npmVersion: false,
        tarballDir: './dist',
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.version} [no ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
