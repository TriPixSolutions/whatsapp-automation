/** Single server/worker API version contract. Override only after checking Meta's changelog. */
import { graphVersion } from '../../../shared/meta-config.cjs';
export const META_GRAPH_VERSION: string = graphVersion(process.env);
