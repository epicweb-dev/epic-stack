#!/usr/bin/env bash

set -eo pipefail

this_dir=$(cd -P -- "$(dirname -- "$(command -v -- "$0")")" && pwd -P)
workspace_root=$(realpath ${this_dir}/..)

if [ -n "${REMOTE_CONTAINERS}" ]; then
	#
	# do 1-time post-container-create tasks that are
	# needed by all users of this local devcontainer.
	sudo chown -R node:node "${workspace_root}/node_modules"

	#
	# if defined, run the local post-container-create logic
	# for a given developer working on the project [optional]
	local_post_create_file="${this_dir}/post-create.local.sh"
	if [ -f "${local_post_create_file}" ]; then
		"${local_post_create_file}"
	fi
fi

if [ -n "${CODESPACES}" ]; then
	#
	# do 1-time post-container-create tasks that are
	# needed by all users of this GitHub Codespace.
	sudo chown -R node:node "${workspace_root}/node_modules"
fi

unset this_dir
unset workspace_root
unset local_post_create_file
