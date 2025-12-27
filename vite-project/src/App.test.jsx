import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import App from './App';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Add specific assertions based on your App's initial render output
    // For example: expect(screen.getByText(/Athenaeum/i)).toBeInTheDocument();
  });
});
