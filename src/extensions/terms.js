import {models} from '../db'
import Database from '../db'

var _sequelize = require('sequelize')

const TermsQuery = `
  extend type Query {
    terms(taxonomies: String): [Post],
    filters(taxonomy: String, ids: String = ""): [FilterResult]
  }
  type FilterResult {
    term_id: Int
    name: String
    slug: String
    taxonomy: String
  }
`

function getPosts(ids = 0) {
  let params = (ids)? {
    where: {
      id: {
        $in: ids
      }
    },
    logging: console.log
  }: {logging: console.log};
  return models.Post.findAll(params).then(r => {
    // console.log('posts', r)
    return r
  })
}

const TermsResolver = {
  Query: {
    terms(_, ref) {
      // console.log(ref);
      // 
      if (!ref.taxonomies) {
        return getPosts()
      }

      let q = "SELECT object_id FROM `wp_term_relationships` WHERE `term_taxonomy_id` IN (:ids) group by object_id having count(*) = :length"

      let ids = ref.taxonomies.split(',').map(r => parseInt(r)) 

      return Database.connection.query(q, {
        replacements: {
          length: ids.length,
          ids: ids
        },
        type: _sequelize.QueryTypes.SELECT,
        // logging: console.log
      }).then(result => {
        return getPosts(result.map(r => r.object_id))
      })
    },
    filters(_, ref) {
      // console.log('term_ids', ref.ids.split(','))
      let q = "SELECT DISTINCT t.term_id, t.name, t.slug, tt.taxonomy FROM `wp_terms` t LEFT JOIN wp_term_relationships tr ON (tr.term_taxonomy_id = t.term_id) LEFT JOIN wp_term_taxonomy tt ON (tt.term_id = t.term_id) WHERE tt.taxonomy LIKE :taxonomy"
      if (ref.ids) {
        q += " AND tr.object_id IN (SELECT DISTINCT object_id FROM `wp_term_relationships` WHERE `term_taxonomy_id` IN (:ids))"
      }

      var _sequelize = require('sequelize');

      return Database.connection.query(q, {
        replacements: {
          taxonomy: ref.taxonomy,
          ids: ref.ids.split(',').map(r => parseInt(r))
        },
        type: _sequelize.QueryTypes.SELECT,
        // logging: console.log
      }).then(filters => {
          // console.log('filter res', filters)
          return filters
        })
    }
  }
}

var _lodash = require('lodash');

export {TermsQuery, TermsResolver}