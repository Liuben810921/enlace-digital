"""Fail-closed static validator for the portable OSRM Compose template.
No Docker, YAML parser, network, or file writes needed.
Requires exact template structure; rejects deviations pending review.
"""
import argparse
import hashlib
import pathlib
import re

EXPECTED = '''name: enlace-osrm-portable
services:
  osrm:
    image: ${OSRM_IMAGE_DIGEST:?set_verified_image_digest}
    command: ["osrm-routed", "--algorithm", "mld", "/data/havana.osrm"]
    user: "65532:65532"
    read_only: true
    privileged: false
    cap_drop: ["ALL"]
    security_opt: ["no-new-privileges:true"]
    cpus: "2.0"
    mem_limit: 2g
    memswap_limit: 2g
    pids_limit: 128
    tmpfs: ["/tmp:rw,noexec,nosuid,nodev,size=64m,uid=65532,gid=65532"]
    volumes: ["${OSRM_DATA_DIR:?set_dedicated_data_dir}:/data:ro"]
    ports: ["127.0.0.1:5000:5000"]
    restart: "no"
    init: true
'''

def validate(text):
    if not isinstance(text, str) or text != EXPECTED:
        raise ValueError('Compose diverges from reviewed fail-closed template')
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def validate_parameters(digest, directory):
    if not re.fullmatch(r'ghcr\.io/project-osrm/osrm-backend@sha256:[0-9a-f]{64}', digest, flags=re.ASCII):
        raise ValueError('OSRM image digest not verified or malformed')
    if not directory or not directory.startswith('/srv/enlace-osrm/') or '..' in pathlib.PurePosixPath(directory).parts or directory.endswith('/'):
        raise ValueError('Data directory outside dedicated prefix')
    if '\n' in directory or ':' in directory or '$' in directory or '\\' in directory:
        raise ValueError('Unsafe path characters')
    return True

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('compose')
    a = p.parse_args()
    print('PASS template sha256:', validate(pathlib.Path(a.compose).read_text(encoding='utf-8')))
