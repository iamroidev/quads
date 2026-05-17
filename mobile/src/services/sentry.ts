import * as Sentry from '@sentry/react-native';

function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: __DEV__,
  });
}

export default initSentry;
