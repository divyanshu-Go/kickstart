// pages/_app.js
import Head from 'next/head';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Kickstart</title>
        <link rel="icon" href="/favicon.ico?v=2" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}