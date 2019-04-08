import {ApolloServer} from 'apollo-server'
import {WordExpressDefinitions, WordExpressResolvers} from 'wordexpress-schema'
import {connectors} from './db'
import {DocumentationQuery, DocumentationResolver} from './extensions/documentation'
import {TermsQuery, TermsResolver} from './extensions/terms'
import {PostQuery, PostResolver} from './extensions/post'
import merge from 'lodash.merge'
import Config from 'config'

const PORT = 4000

const RootResolvers = WordExpressResolvers(connectors, Config.get('public'))
const Resolvers = merge(RootResolvers, DocumentationResolver, PostResolver, TermsResolver)

const server = new ApolloServer({
  typeDefs: [...WordExpressDefinitions, DocumentationQuery, PostQuery, TermsQuery],
  resolvers: Resolvers
})

server.listen({port: PORT}, () => {
  console.log(`wordexpress server is now running on port ${PORT}`)
})
