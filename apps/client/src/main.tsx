import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import App from './App';
import { store } from './store';
import './index.css';

// Apollo Client setup
const httpLink = new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ApolloProvider client={apolloClient}>
            <Provider store={store}>
                <App />
            </Provider>
        </ApolloProvider>
    </StrictMode>
);
