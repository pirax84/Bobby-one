/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true, typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true },
  // Nidami (autre projet) est servi comme site statique dans /nidami/
  async redirects() { return [{ source: "/nidami", destination: "/nidami/index.html", permanent: false }, { source: "/nidami/", destination: "/nidami/index.html", permanent: false }]; },
};
