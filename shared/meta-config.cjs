function graphVersion(env = process.env) {
  const version = env.META_GRAPH_API_VERSION || 'v25.0';
  if (!/^v\d+\.0$/.test(version)) throw new Error('Invalid Meta Graph API version configuration');
  return version;
}
module.exports = { graphVersion };
