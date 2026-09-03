import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const dialogue = document.querySelector('[data-block="4"]');
const avatarRail = dialogue?.querySelector('[data-dialogue-avatar-rail]');
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktopLayout = matchMedia('(min-width:901px)');

function restartAvatarAnimation(avatar, animationClass) {
  if (!avatar || !avatarRail?.classList.contains('is-visible')) return;
  avatar.classList.remove('is-user-typing', 'is-agent-morphing');
  void avatar.offsetWidth;
  avatar.classList.add(animationClass);
}

function initDialogueAvatarStates() {
  if (!dialogue || !avatarRail || prefersReducedMotion || !desktopLayout.matches) return;

  const agentAvatar = avatarRail.querySelector('.hotel-message-avatar--agent');
  const userAvatar = avatarRail.querySelector('.hotel-message-avatar--user');
  const avatars = [agentAvatar, userAvatar].filter(Boolean);
  const messageRows = [...dialogue.querySelectorAll('.hotel-message-row')];
  let activeAvatar = null;

  const hideAvatar = avatar => {
    if (!avatar || activeAvatar !== avatar) return;
    avatar.classList.remove('is-avatar-active', 'is-user-typing', 'is-agent-morphing');
    activeAvatar = null;
  };

  const hideAllAvatars = () => {
    avatars.forEach(avatar => {
      avatar.classList.remove('is-avatar-active', 'is-user-typing', 'is-agent-morphing');
    });
    activeAvatar = null;
  };

  const showAvatarForRow = row => {
    const message = row.querySelector('.hotel-message');
    const isUserMessage = message?.classList.contains('hotel-message--user');
    const avatar = isUserMessage ? userAvatar : agentAvatar;

    if (!avatar) return;
    hideAllAvatars();
    activeAvatar = avatar;
    avatar.classList.add('is-avatar-active');
    if (isUserMessage) restartAvatarAnimation(avatar, 'is-user-typing');
  };

  avatarRail.addEventListener('animationend', event => {
    if (event.animationName === 'hotelDialogueUserTyping') {
      event.target.classList.remove('is-user-typing');
    }
    if (event.animationName === 'hotelDialogueAgentMorph') {
      event.target.classList.remove('is-agent-morphing');
    }
  });

  messageRows.forEach(row => {
    const message = row.querySelector('.hotel-message');
    const isUserMessage = message?.classList.contains('hotel-message--user');
    const avatar = isUserMessage ? userAvatar : agentAvatar;

    ScrollTrigger.create({
      trigger:message,
      start:'top 91%',
      end:'top 64%',
      invalidateOnRefresh:true,
      onEnter:() => showAvatarForRow(row),
      onEnterBack:() => showAvatarForRow(row),
      onLeave:() => hideAvatar(avatar),
      onLeaveBack:() => hideAvatar(avatar)
    });
  });

  hideAllAvatars();
}

initDialogueAvatarStates();
