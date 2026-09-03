export function initAgentMessageGradients(root = document, { reduced = false } = {}) {
  const messages = [...root.querySelectorAll('.hotel-message--agent')];
  if (!messages.length) return () => {};

  messages.forEach(message => {
    message.querySelector('.hotel-message__agent-video')?.remove();
    message.classList.remove('has-agent-video', 'is-agent-orb-active');
    message.classList.remove('hotel-message--orb');
    delete message.dataset.agentVideoReady;
  });

  return () => {
    messages.forEach(message => {
      message.classList.remove('hotel-message--orb', 'is-agent-orb-active');
    });
  };
}
