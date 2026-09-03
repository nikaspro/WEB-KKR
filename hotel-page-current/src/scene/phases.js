// Единственный источник таймингов. Число фазы нигде больше нет.
// Окна определяются в единицах p (прогресс скролла). p не нормализован в 0…1:
// карта тянется до 1.695, последняя фаза charge заканчивается там.
// Проверку на пересечения запускает: npm run phases:check

export const DIVE_AT = 0.020;
export const DIVE_LEN = 0.090;
export const CAP0_AT = 0.622;
export const MIRROR_AT = 0.730;
export const MIRROR_LEN = 0.232;
export const CAP1_AT = 0.832;
export const DARK_AT = 0.964;
export const DARK_LEN = 0.024;
export const CAP2_AT = 1.016;
export const CHARGE_AT = 1.240;
export const CHARGE_LEN = 0.455;

export const phases = [
  { id: 'dive', at: DIVE_AT, len: DIVE_LEN },
  { id: 'loader', at: 0.440, len: 0.138 },
  { id: 'influx', at: 0.470, len: 0.110,
    overlap: true, why: 'влёт идёт поверх лоадера: карточки летят, пока лоадер ещё крутится' },
  { id: 'cap0', at: CAP0_AT, len: 0.104 },  // «куда сходить»: после полного ухода потока
  { id: 'mirror', at: MIRROR_AT, len: MIRROR_LEN },
  { id: 'grp1', at: 0.786, len: 0.036,      // Перед заездом в экране
    overlap: true, why: 'смена группы в экране идёт под длинной фазой mirror' },
  { id: 'cap1', at: CAP1_AT, len: 0.126,    // «вся поездка»
    overlap: true, why: 'mirror тянется под надписью всю её длину' },
  { id: 'dark', at: DARK_AT, len: DARK_LEN },
  { id: 'grp2', at: 0.972, len: 0.036,      // День в экране
    overlap: true, why: 'смена группы начинается на затемнении dark' },
  { id: 'cap2', at: CAP2_AT, len: 0.224 },  // «помощник» остаётся до зарядки
  { id: 'grp3', at: 1.196, len: 0.036,      // скрытая подготовка экрана к зарядке
    overlap: true, why: 'контент телефона меняется под полноэкранным помощником; сам телефон скрыт' },
  { id: 'charge', at: CHARGE_AT, len: CHARGE_LEN },
];
