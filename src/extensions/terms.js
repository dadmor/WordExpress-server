import {models} from '../db'
import Database from '../db'

var _sequelize2 = require('sequelize')

const TermsQuery = `
  extend type Query {
    terms(city: Int = 0, activity: Int = 0, ageGroup: Int = 0): [Post],
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
      if (!ref.city) {
        return getPosts()
      }

      return models.TermRelationships.findAll({
        where: {
          term_taxonomy_id: ref.city
        },
        // logging: console.log
      }).then(rs => {
        let dv = rs.map(function (r) {
          return r.dataValues.object_id;
        });

        // console.log('city', dv)
        // console.log(ref.activity)
        if (!ref.activity) {
          return getPosts(dv)
        }

        return models.TermRelationships.findAll({
          where: {
            term_taxonomy_id: ref.activity
          }
        }).then(rd => {
          let dvd = rd.map(function (r) {
            return r.dataValues.object_id;
          });

          // console.log('activity', dvd)
          if (!ref.ageGroup) {
            let cl = _lodash.intersection(dv, dvd)            
            return getPosts(cl)
          }

          return models.TermRelationships.findAll({
            where: {
              term_taxonomy_id: ref.ageGroup
            }
          }).then(rf => {
            let dvr = rf.map(function (r) {
              return r.dataValues.object_id;
            });

            // console.log('ageGroup', dvr)

            let cl = _lodash.intersection(dv, dvd, dvr)            

            // console.log(cl)

            return getPosts(cl)
          })
        })
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