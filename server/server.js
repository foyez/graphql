const {
  ApolloServer,
  gql,
  PubSub,
  AuthenticationError,
  UserInputError,
  ApolloError,
  SchemaDirectiveVisitor,
} = require('apollo-server')
const { defaultFieldResolver } = require('graphql')

const pubsub = new PubSub()
const NEW_ITEM = 'NEW_ITEM'

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver
    field.resolve = (args) => {
      console.log('🔥 hello')
      return resolver.apply(this, args)
    }
  }
}

const typeDefs = gql`
  directive @log on FIELD_DEFINITION

  type User {
    id: ID! @log
    error: String! @deprecated(reason: "use the other field")
    username: String!
    createdAt: String!
  }

  type Settings {
    user: User!
    theme: String!
  }

  type Item {
    task: String!
  }

  # pass an object as a argument
  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
    createItem(task: String!): Item!
  }

  type Subscription {
    newItem: Item
  }
`

const resolvers = {
  Query: {
    me() {
      return {
        id: 1,
        username: 'foyez',
        createdAt: '3749584958',
      }
    },
    // (root, args, context, info)
    settings(_, { user }) {
      return {
        user,
        theme: 'Light',
      }
    },
  },

  Mutation: {
    settings(_, { input }) {
      return input
    },
    createItem(_root, { task }) {
      const item = { task }
      pubsub.publish(NEW_ITEM, { newItem: item })

      return item
    },
  },

  Subscription: {
    newItem: {
      subscribe: () => pubsub.asyncIterator(NEW_ITEM),
    },
  },

  Settings: {
    user() {
      return { id: 1, username: 'foyez', createdAt: 3749584958 }
    },
  },
  User: {
    error() {
      // throw new Error("nooo");
      // throw new AuthenticationError('not authenticated')
      // throw new UserInputError('wrong args', { invalidArgs: 'name' })
      return 'error'
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
  },
  // formatError(err) {
  //   console.log(err)
  //   return err
  // },
  context({ connection }) {
    if (connection) {
      return { ...connection.context }
    }

    return {}
  },
  subscriptions: {
    onConnect(connectionParams) {
      // handle auth here
    },
  },
})

server.listen().then(({ url }) => console.log(`server at ${url}`))
