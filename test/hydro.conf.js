/**
 * Hydro configuration
 *
 * @param {Hydro} hydro
 */

module.exports = function(hydro) {
  require('babel/register')
  hydro.set({
    timeout: 500,
    plugins: [require('hydro-bdd')]
  })
}
