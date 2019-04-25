import {models} from '../db'
import {map} from 'lodash'

var _sequelize = require('sequelize')

const PostQuery = `
  extend type Query{
    getFilteredPosts: [Category]
    postsWithChildren(post_type: String = "post", limit: Int, skip: Int, order: OrderInput): [Post]
    geoJSON(ids: [Int]): FeatureCollection
  }
  extend type Post {
    children: [Post]
    geo_data: FeatureCollection
  }
  extend type Category {
    taxonomy_name: String
  }
  scalar Coordinates
  type PointGeometry {
    type: String!
    coordinates: Coordinates!
  }
  type PointProps {
    id: Int!
    lat: Float
    lon: Float
  }
  type PointObject {
    type: String!
    geometry: PointGeometry
    properties: PointProps
  }
  type FeatureCollection {
    type: String!
    features: [PointObject]
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
    },
    geoJSON: (_, {ids}) => {
      let condition = {
          meta_key: "geo_data"
      }

      if (ids) {
        condition.post_id = {
          [_sequelize.Op.in] : ids
        }
      }

      return models.Postmeta.findAll({
        attributes: ["meta_value"],
        where: condition
      }).then((ret) => {
        let geom = []
        for (let geo in ret[0].dataValues) {
          geom.push(JSON.parse(ret[0].dataValues[geo]))
        }
        
        var geojsonMerge = require('@mapbox/geojson-merge');

        var mergedGeoJSON = geojsonMerge.merge(geom);
        // console.log(mergedGeoJSON)
        return mergedGeoJSON
      })
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
    },
    geo_data: (root) => {
      let res = models.Postmeta.findOne({
        attributes: ["meta_value"],
        where: {
          post_id: root.dataValues.id,
          meta_key: "geo_data"
        }
      })
      return res.then((res) => {
        if (res) {
          return JSON.parse(res.meta_value)
        }
        return ""
      })
    }
  },
  Category: {
    taxonomy_name: (root) => {
      // console.log('md', models.Terms);
      return models.TermTaxonomy.findOne({
        attributes: ['taxonomy'],
        where: {
          term_id: root.dataValues.term_id
        }
      }).then(result => {
        // console.log(result)
        return result.dataValues.taxonomy
      })
    }
  }
}


export {PostQuery, PostResolver}