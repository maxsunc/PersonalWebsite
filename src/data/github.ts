import currentRepositoryConfig from '@/data/config/current-repository.json';

// Keep this in sync with the Repository URL validation in public/admin/config.yml.
const repositoryMatch = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/((?!\.{1,2}\/?$|\.git\/?$)[A-Za-z0-9_.-]+)\/?$/.exec(
  currentRepositoryConfig.repositoryUrl.trim(),
);

if (!repositoryMatch) {
  throw new Error('Current repository must be a GitHub repository URL (https://github.com/owner/repo).');
}

export const github = {
  username: 'maxsunc',
  currentRepository: {
    owner: repositoryMatch[1],
    name: repositoryMatch[2].replace(/\.git$/, ''),
  },
};
