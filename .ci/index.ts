import * as pulumi from '@pulumi/pulumi'

import { createFargateTask } from 'dcl-ops-lib/createFargateTask'
import { env, envTLD } from 'dcl-ops-lib/domain'

export = async function main() {
  const config = new pulumi.Config()
  const hostname = 'graph-node.decentraland.' + envTLD

  const graphNode = await createFargateTask(
    `graph-node`,
    'graphprotocol/graph-node:latest',
    8020,
    [
      { name: 'postgres_host', value: config.requireSecret('postgres_host') },
      { name: 'postgres_port', value: '5432' },
      { name: 'postgres_user', value: 'postgres' },
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
      version: '1',
      memoryReservation: 1024,
      extraExposedServiceOptions: {
        createCloudflareProxiedSubdomain: true
      }
    }
  )

  const publicUrl = graphNode.endpoint

  return {
    publicUrl,
  }
}