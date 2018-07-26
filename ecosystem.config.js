module.exports = {
  apps : [{
    name      : 'Dunkhut-Party',
    script    : 'index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production : {
      NODE_ENV: 'production'
    },
    watch: true,
    ignore_watch: ['node_modules', 'resources']
  }],

};
