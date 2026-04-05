import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App - Tela de Login', () => {
  it('deve mostrar o botão de Modo Offline/Local ao iniciar', () => {
    render(<App />);
    screen.debug(); // Mostra o HTML no terminal de erro
    
    const offlineButton = screen.queryByText(/modo local \(offline\)/i);
    expect(offlineButton).toBeInTheDocument();
  });
});
