import {models} from '../db'

const TermsQuery = `
  extend type Query {
    terms(city: Int = 0, activity: Int = 0, ageGroup: Int = 0): [Post]
  }
`

const TermsResolver = {
	Query: {
		terms(_, ref) {
			// console.log(ref);

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

				return models.TermRelationships.findAll({
					where: {
						term_taxonomy_id: ref.activity
					}
				}).then(rd => {
					let dvd = rd.map(function (r) {
						return r.dataValues.object_id;
					});

					// console.log('activity', dvd)

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

						console.log(cl)

						return models.Post.findAll({
							where: {
								id: {
									$in: cl
								}
							},
							logging: console.log
						}).then(r => {
							// console.log('posts', r)
							return r
						})
					})
				})
			})
		}
	}
}

var _lodash = require('lodash');

export {TermsQuery, TermsResolver}
