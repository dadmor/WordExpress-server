import {models} from '../db'

const TermsQuery = `
  extend type Query {
    terms(city: Int = 0, activity: Int = 0, ageGroup: Int = 0): [Post]
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
    }
  }
}

var _lodash = require('lodash');

export {TermsQuery, TermsResolver}