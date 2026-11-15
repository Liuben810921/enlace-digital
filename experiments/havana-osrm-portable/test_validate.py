import unittest
from validate import EXPECTED, validate, validate_parameters

class TemplateSecurity(unittest.TestCase):
    def test_original(self): self.assertEqual(len(validate(EXPECTED)),64)
    def test_mutations(self):
        attacks = [
            ('127.0.0.1:5000:5000','0.0.0.0:5000:5000'),
            ('127.0.0.1:5000:5000','[::]:5000:5000'),
            ('privileged: false','privileged: true'),
            ('read_only: true','read_only: false'),
            ('cap_drop: ["ALL"]','cap_add: ["SYS_ADMIN"]'),
            ('no-new-privileges:true','no-new-privileges:false'),
            ('mem_limit: 2g','mem_limit: 20g'),
            ('cpus: "2.0"','cpus: "20"'),
            ('pids_limit: 128','pids_limit: -1'),
            ('restart: "no"','restart: always'),
            (':/data:ro',':/data:rw'),
            ('65532:65532','0:0'),
            ('--algorithm", "mld"','--algorithm", "ch"'),
            ('name: enlace-osrm-portable','name: other-project'),
            ('  osrm:\n','  osrm:\n    network_mode: host\n'),
            ('  osrm:\n','  osrm:\n    pid: host\n'),
            ('  osrm:\n','  osrm:\n    volumes: ["/:/host"]\n'),
            ('  osrm:\n','  osrm:\n    devices: ["/dev/sda"]\n'),
            ('  osrm:\n','  osrm:\n    env_file: .env\n'),
            ('  osrm:\n','  osrm:\n    labels: ["traefik.enable=true"]\n'),
        ]
        for old,new in attacks:
            with self.subTest(new=new):
                self.assertIn(old, EXPECTED)
                with self.assertRaises(ValueError): validate(EXPECTED.replace(old,new,1))
    def test_paths_and_digest(self):
        good='ghcr.io/project-osrm/osrm-backend@sha256:'+'a'*64
        self.assertTrue(validate_parameters(good,'/srv/enlace-osrm/data'))
        for path in ['/etc','/srv/enlace-osrm/../private','/srv/enlace-osrm/data:rw','/srv/enlace-osrm/data\nfoo','/srv/enlace-osrm/','']:
            with self.subTest(path=path), self.assertRaises(ValueError): validate_parameters(good,path)
        for digest in ['latest','ghcr.io/project-osrm/osrm-backend:latest','ghcr.io/project-osrm/osrm-backend@sha256:123']:
            with self.subTest(digest=digest), self.assertRaises(ValueError): validate_parameters(digest,'/srv/enlace-osrm/data')

if __name__ == '__main__': unittest.main()
