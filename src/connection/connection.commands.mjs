/* eslint-disable */
import { ProtocolServer } from '../protocol/protocol.server.mjs'
import { HostRepository } from '../hosts/host.repository.mjs'
/* eslint-enable */
import assert from 'node:assert'
import logger from '../logger.mjs'

/**
* @param {HostRepository} hostRepository
*/
export function handleConnect (hostRepository) {
  /**
  * @param {ProtocolServer} server
  */
  return function (server) {
    server.on('connect', (data, socket) => {
      const log = logger.child({ name: 'cmd:connect' })

      const oid = data
      const host = hostRepository.find(oid)
      const client = hostRepository.findBySocket(socket)
      log.debug(
        { oid, client: socket.address() },
        'Client attempting to connect to host'
      )
      assert(host, 'Unknown host oid: ' + oid)
      assert(host.rinfo, 'Host has no remote info registered!')
      assert(client, 'Unknown client from address')
      assert(client.rinfo, 'Client has no remote info registered!')

      const hostAddress = stringifyAddress(host.rinfo)
      const clientAddress = stringifyAddress(client.rinfo)
      server.send(socket, 'connect', hostAddress)
      server.send(host.socket, 'connect', clientAddress)
      log.debug(
        { client: clientAddress, host: hostAddress, oid },
        'Connected client to host'
      )
    })
  }
}

/**
* @param {HostRepository} hostRepository
*/
export function handleConnectRelay (hostRepository) {
  /**
  * @param {ProtocolServer} server
  */
  return function (server) {
    server.on('connect-relay', (data, socket) => {
      const log = logger.child({ name: 'cmd:connect-relay' })

      const oid = data
      const host = hostRepository.find(oid)
      const client = hostRepository.findBySocket(socket)
      log.debug(
        { oid, client: `${socket.remoteAddress}:${socket.remotePort}` },
        'Client attempting to connect to host'
      )
      assert(host, 'Unknown host oid: ' + oid)
      assert(host.relay, 'Host has no relay!')
      assert(client, 'Unknown client from address')
      assert(client.relay, 'Client has no relay!')

      log.debug({ relay: host.relay }, 'Replying with relay')
      server.send(socket, 'connect-relay', host.relay)
      server.send(host.socket, 'connect-relay', client.relay)
      log.debug(
        { client: `${socket.remoteAddress}:${socket.remotePort}`, relay: host.relay, oid },
        'Connected client to host'
      )
    })
  }
}

function stringifyAddress (address) {
  return `${address.address}:${address.port}`
}
