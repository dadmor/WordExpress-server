import {models} from '../db'
import {map} from 'lodash'




const PostQuery = `
  extend type Query{
    postsWithChildren(post_type: String = "post", limit: Int, skip: Int, order: OrderInput): [Post]
  }
  extend type Query{
    getFilteredPosts: [Category]
  }
  extend type Post {
    children: [Post]
  }
`

const PostResolver = {
  Query: {
    postsWithChildren(_, {post_type, order, limit = 10, skip = 0}) {
      const orderBy = order ? [order.orderBy, order.direction] : ['menu_order', 'ASC']
      return models.Post.findAll({
        where: {

        },
        order: [orderBy],
        limit: limit,
        offset: skip
      })
    },
    getFilteredPosts(_) {
      return models.TermRelationships.findAll({
        where: {
        object_id: postId
      },
      })
    // return this.get(`movies/${id}`);

      
      // return RESTDataSource.get('http://localhost:8080/wp-json/wp/v2/place?filter[city]=warszawa');
      return [{id:RESTDataSource}]
    }
  },
  Post: {
    children: (root) => {
      return models.Post.findAll({
        where:{
          post_parent: root.dataValues.id,
          post_status: 'publish'
        },
        order: [
          ['menu_order', 'ASC']
        ]
      })
    }
  }
}


export {PostQuery, PostResolver}