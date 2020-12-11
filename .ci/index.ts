import * as pulumi from '@pulumi/pulumi'

import { createFargateTask } from 'dcl-ops-lib/createFargateTask'
import { getDbHost } from 'dcl-ops-lib/supra'
import { envTLD } from 'dcl-ops-lib/domain'
import { acceptDbSecurityGroupId } from 'dcl-ops-lib/acceptDb'

export = async function main() {
  const config = new pulumi.Config()
  const hostname = 'graph-logs.decentraland.' + envTLD

  const graphNode = await createFargateTask(
    'graph-node',
    'graphprotocol/graph-node:latest',
    8030,
    [
      { name: 'postgres_host', value: getDbHost() },
      { name: 'postgres_port', value: '5432' },
      { name: 'postgres_user', value: 'graph-node' },
      { name: 'RUST_LOG', value: 'info' },
      { name: 'postgres_pass', value: config.requireSecret('postgres_pass') },
      { name: 'postgres_db', value: 'graph-node' },
      { name: 'ipfs', value: 'https://ipfs.infura.io:5001' },
      { name: 'ethereum', value: config.requireSecret('ethereum') },
      { name: 'GRAPH_ETHEREUM_CLEANUP_BLOCKS', value: 'true' },
      { name: 'ETHEREUM_REORG_THRESHOLD', value: '50' },
      { name: 'ETHEREUM_ANCESTOR_COUNT', value: '50' }
    ],
    hostname,
    {
      // @ts-ignore
      healthCheck: {
        path: '/',
        interval: 60,
        timeout: 10,
        unhealthyThreshold: 10,
        healthyThreshold: 3,
        port: '8030'
      },
      version: '1',
      extraExposedServiceOptions: {
        createCloudflareProxiedSubdomain: true
      },
      extraALBMappings: [
        { domain: 'graph.decentraland.' + envTLD, dockerListeningPort: 8020 },
        { domain: 'graph-play.decentraland.' + envTLD, dockerListeningPort: 8000 }
      ],
      securityGroups: [await acceptDbSecurityGroupId()]
    }
  )

  const publicUrl = graphNode.endpoint

  return {
    publicUrl,
  }
}
