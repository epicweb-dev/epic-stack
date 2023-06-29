#!/usr/bin/env bash

set -eo pipefail

if [ -n "${REMOTE_CONTAINERS}" ]; then
	this_dir=$(cd -P -- "$(dirname -- "$(command -v -- "$0")")" && pwd -P)
	workspace_root=$(realpath ${this_dir}/..)

	#
	# do 1-time post-container-create tasks that are
	# needed by all users of this devcontainer.
	sudo chown -R node:node node_modules

	#
	# if defined, run the local post-container-create logic
	# for a given developer working on the project [optional]
	local_post_create_file="${this_dir}/post-create.local.sh"
	if [ -f "${local_post_create_file}" ]; then
		"${local_post_create_file}"
	fi

	unset this_dir
	unset workspace_root
	unset local_post_create_file
fi
