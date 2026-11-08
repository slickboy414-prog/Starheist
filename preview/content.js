// =====================================================================
//  STAR HEIST content pack: extra celebs, fusion exclusives, weekly
//  limited celebs and fusion recipes. Every character is fictional.
// =====================================================================

// Archetype -> accessories and fame "theme" used by daily theme days.
const ARCH = {
  singer: ['mic'], rock: ['guitar', 'shades'], dj: ['headphones', 'shades'], athlete: ['headband'],
  actor: ['shades'], chef: ['chefhat', 'pan'], magic: ['tophat', 'wand', 'cape'], influencer: ['phone'],
  royal: ['crown', 'cape'], cowboy: ['cowboy', 'guitar'], model: ['shades'], gamer: ['headphones'],
  host: ['tie', 'mic'], dancer: ['headband'], astro: ['helmet', 'cape'],
};
const HATS = ['cap', 'tophat', 'cowboy', 'chefhat', 'crown', 'helmet', 'tiara'];
const ATHLETE_PROPS = ['ball', 'trophy', 'dumbbell'];
const SKINS = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffe0bd, 0xd1a17a];
const HAIRS = [0x111111, 0x3b2314, 0x6b4423, 0xf5d76e, 0xc0392b, 0xff66cc, 0x7fdfff, 0xffffff, 0xb57edc, 0x2b1d0e];
const STYLES = ['short', 'long', 'ponytail', 'buzz', 'mohawk', 'spiky', 'bun', 'afro'];
const TIER_COLORS = [
  [0x3498db, 0xe67e22, 0x27ae60, 0xe74c3c, 0x95a5a6, 0x16a085],
  [0xff66aa, 0x7fdfff, 0x9b59b6, 0x2ecc71, 0xf1c40f, 0xff7f50],
  [0x8e44ad, 0xc0392b, 0x2c3e50, 0xd35400, 0x1abc9c, 0xe84393],
  [0xff3fd0, 0x9b5de5, 0xffd700, 0x00bbf9, 0xf15bb5, 0x00f5d4],
  [0xffd700, 0xc0c0c0, 0x6a0dad, 0xff006e, 0x3a86ff, 0xfb5607],
  [0xffffff, 0xffd700, 0x00f5ff, 0xff4ecd, 0x9d4edd, 0xf8f8ff],
  [0x00ffd5, 0xff00aa, 0xffe600, 0x7b2cff],
  [0xff7af0, 0x00e5ff, 0xffb703, 0x8338ec],
];
// cost range per tier and cost:income ratio (matches the original 21 celebs)
const COST = [[30, 220], [300, 1300], [2000, 9000], [12000, 60000], [90000, 400000], [700000, 3000000]];
const RATIO = [20, 29, 37, 47, 61, 73];

const T = [
  // ---- LOCAL STAR (20 new) ----
  ['Bubbles Barnaby|Mall Bubble Artist|magic', 'Karaoke Kenny|Karaoke Night Champ|singer', 'Anchor Annie|Local News Anchor|host|d',
    'Juggling Jojo|Street Performer|dancer', 'Disco Dez|Wedding DJ|dj', 'Zen Zara|Yoga Influencer|influencer|d',
    'Poodle Penny|Pet Grooming Vlogger|influencer', 'Mayor Muffin|Small-Town Mayor|host', 'Taco Tina|Food Truck Chef|chef',
    'Tap-Tap Tim|Tap Dance Teacher|dancer', 'Mascot Moe|Team Mascot Performer|athlete', 'Unbox Ula|Unboxing Streamer|gamer',
    'Bowling Bo|Bowling League Legend|athlete', 'Dance-Off Dot|School Dance-Off Winner|dancer|d', 'Mime Milo|Park Mime|actor',
    'Yodel Yuki|Mountain Yodeler|singer', 'Pageant Pearl|County Fair Queen|model|d', 'Spelling Bee Sam|Spelling Bee Champ|host',
    'Hot Dog Hank|Hot Dog Eating Champ|chef', 'Balloon Bea|Party Balloon Artist|magic|d'],
  // ---- VIRAL (22 new) ----
  ['Meme Mo|Meme Page Creator|influencer', 'Craze Daisy|Dance Trend Starter|dancer|d', 'Prank Pip|Prank Video Star|influencer',
    'Whisper Ari|ASMR Creator|influencer|d', 'Speedrun Spike|Speedrun Streamer|gamer', 'Kitty Cleo|Cat Video Star|influencer|d',
    'Slime Suki|Slime Video Queen|influencer|d', 'Kickflip Kai|Skate Clip Star|athlete', 'Hack Hugo|Kitchen Hack Creator|chef',
    'Lip-Sync Lola|Lip-Sync Star|singer|d', 'Glow-Up Gia|Makeover Creator|model|d', 'Parkour Pax|Parkour Clip Star|athlete',
    'Rep Count Fiona|Fitness Creator|athlete|d', 'Card Trick Mika|Street Magician|magic', 'React Rae|Reaction Video Host|host|d',
    'Hype Beat Hiro|Viral Beatmaker|dj', 'Vlog Van|Travel Vlogger|influencer', 'Petra Paws|Pet Trick Trainer|influencer|d',
    'Duet Dina|Duet Video Singer|singer|d', 'Toy Theo|Toy Review Star|gamer', 'Beatbox Bex|Beatbox Champ|singer',
    'Unicorn Uri|Glitter Makeup Creator|influencer|d'],
  // ---- FAMOUS (21 new) ----
  ['Sitcom Sid|Sitcom Star|actor', 'Talk Show Tess|Daytime Talk Show Host|host|d', 'Ace Tara|Pro Tennis Star|athlete|d',
    'Racing Rio|Racing Driver|athlete', 'Opera Ophelia|Opera Soprano|singer|d', 'Fashion Fizz|Fashion Designer|model|d',
    'Quizmaster Quinn|Game Show Host|host', 'Skate Pro Sky|Pro Skateboarder|athlete', 'Pop-Punk Pixie|Pop-Punk Singer|rock|d',
    'Cartoon Cody|Cartoon Voice Actor|actor', 'Magician Mira|Stage Magician|magic|d', 'Ballet Bella|Prima Ballerina|dancer|d',
    'Rally Rosa|Rally Champion|athlete|d', 'Stand-Up Stu|Stand-Up Comedian|actor', 'Drummer Dex|Rock Drummer|rock',
    'Surf Sol|Pro Surfer|athlete', 'Boxing Brix|Boxing Champ|athlete', 'Figure Skater Fae|Figure Skating Star|dancer|d',
    'Gardener Gil|TV Garden Expert|host', 'Reality Remy|Reality Show Star|influencer|d', 'Gadget Juno|Tech Show Host|gamer|d'],
  // ---- SUPERSTAR (21 new) ----
  ['Arena Ash|Arena Rock Star|rock', 'Blockbuster Blaze|Blockbuster Hero|actor', 'Splash Sterling|Olympic Swim Champion|athlete',
    'Luna Lux|Galaxy Pop Star|singer|d', 'Mint Monarch|Hip-Hop Mogul|singer', 'Runway Raye|Supermodel|model|d',
    'Turbo Tilly|Race Car Champion|athlete|d', 'Coco Caliente|Latin Pop Sensation|singer|d', 'Neon Nine|Idol Group Leader|dancer',
    'Reel Rafferty|Movie Director|actor', 'Volt Vega|Festival EDM Headliner|dj', 'Aurora Ace|Grand Slam Champion|athlete|d',
    'Thunder Thorne|Rock Legend|rock', 'Velour Vane|Couture Icon|model', 'Daredevil Dash|Stunt Superstar|actor',
    'Moonlight Mack|Late-Night Show Host|host', 'Crystal Kiss|Pop Diva|singer|d', 'Pixel Prime|Esports World Champion|gamer',
    'Doodle Duchess|Animated Movie Star|actor|d', 'Silk Sonata|R&B Superstar|singer|d', 'Rodeo Ruby|Country Queen|cowboy|d'],
  // ---- ICON (22 new) ----
  ['Golden Gala|Award Show Legend|actor|d', 'Platinum Phoenix|Platinum Record Icon|singer|d', 'Eternal Echo|Stadium Tour Icon|rock',
    'Starlight Sovereign|Pop Royalty|royal|d', 'Midnight Majesty|Jazz Legend|singer', 'Opal Overture|Classical Superstar|singer|d',
    'Legend Lyric|Rap Icon|singer', 'Cosmic Crooner|Timeless Crooner|singer', 'Satin Siren|Silver-Screen Siren|actor|d',
    'Empire Eclipse|Media Empire Mogul|royal', 'Royal Rhapsody|Rock Opera Icon|rock', 'Infinity Idol|Global Idol|dancer|d',
    'Titan Tempo|DJ of the Century|dj', 'Aurora Anthem|Anthem Singer|singer|d', 'Supernova Sage|Sci-Fi Movie Icon|astro',
    'Marquee Maestro|Film Score Legend|magic', 'Spotlight Sphinx|Mystery Magic Icon|magic', 'Encore Empress|Broadway Icon|royal|d',
    'Gilded Groove|Dance Floor Icon|dancer', 'Halo Heartbeat|Billion-View Icon|influencer|d', 'Crown Cadence|Hip-Hop Royalty|royal',
    'Spectrum Star|Rainbow Pop Icon|singer|d'],
  // ---- ALL-TIME GOAT (23 new) ----
  ['Omega Ovation|Greatest Showman Ever|magic', 'Immortal Icon|Most Famous Star Alive|royal|d', 'Celestial Champion|All-Time Sports Great|athlete',
    'Mythos Maximus|Movie Legend of the Century|actor', 'Quantum Queen|Queen of Pop Forever|royal|d', 'The Final Boss|Unbeatable Gamer|gamer',
    'Zenith Zephyr|Fastest Athlete Ever|athlete', 'Hall-of-Fame Hero|Hall of Fame Legend|athlete', 'Universe Unbeaten|Undefeated Fighter|athlete',
    'Paragon Prime|Billion-Fan Icon|singer', 'Living Legend|Living Music Legend|rock', 'Apex Anthem|Greatest Voice Ever|singer|d',
    'Galaxy Gladiator|Space-Age Champion|astro', 'Timeless Titan|Timeless Movie Titan|actor', 'Golden Era Gem|Golden-Era Superstar|actor|d',
    'Record Breaker Rook|World Record Holder|athlete', 'Undefeated Uma|Undefeated Champion|athlete|d', 'Solaris Sky King|Highest-Paid Star|royal',
    'Platinum Pinnacle|Most-Streamed Artist|singer|d', 'Hyperstar Hex|Legend of Magic|magic|d', 'Eternal Encore|Greatest Live Performer|rock',
    'Starborn Seraph|Celestial Pop Icon|singer|d', 'Ultimate Utopia|Ultimate Superstar|royal|d'],
];

// Fusion-only exclusives (tier 6). recipe = three celeb names that must all be in your agency.
const EXCLUSIVES = [
  { e: 'Duet Dynasty|Fusion: Pop Power Duo|singer|d', cost: 2e6, inc: 25e3, fee: 5e4, need: ['Nova Starling', 'Duke Dazzle', 'Kiki Glow'] },
  { e: 'Rockstorm Rex|Fusion: Action Rock Hero|rock', cost: 5e6, inc: 45e3, fee: 15e4, need: ['Riff Raven', 'Rex Steel', 'Thunder Thorne'] },
  { e: 'Chef Galaxy|Fusion: Cosmic Celebrity Chef|chef', cost: 9e6, inc: 7e4, fee: 4e5, need: ['Chef Flambé', 'Taco Tina', 'Cosmic Crooner'] },
  { e: 'Goal Machine|Fusion: Ultimate Sports Icon|athlete', cost: 2e7, inc: 11e4, fee: 1e6, need: ['Goalden Boy', 'Dunk Dynamo', 'The Ultra GOAT'] },
  { e: 'Diva Enigma|Fusion: Magic Movie Diva|magic|d', cost: 3e7, inc: 15e4, fee: 15e5, need: ['Mystic Max', 'Diva Diamond', 'Magician Mira'] },
  { e: 'Cosmo Prime X|Fusion: Galactic Gamer Astronaut|astro', cost: 6e7, inc: 25e4, fee: 3e6, need: ['Captain Cosmo', 'Pixel Prime', 'Supernova Sage'] },
  { e: 'Velvet Infinity|Fusion: Infinite Music Icon|singer|d', cost: 15e7, inc: 5e5, fee: 8e6, need: ['Velvet Vortex', 'Infinity Idol', 'Omega Ovation'] },
  { e: 'The Starville Founder|Fusion: Founder of Starville|royal', cost: 5e8, inc: 12e5, fee: 25e6, need: ['Immortal Icon', 'Living Legend', 'Celestial Champion'] },
];
// Weekly limited celebs (tier 7): only spawn during the weekly Admin Abuse, one per week, rotating.
const LIMITED = [
  'Comet Carnival|Limited: Festival Headliner|dj', 'Neon Noir|Limited: Midnight Movie Star|actor|d',
  'Blizzard Belle|Limited: Winter Pop Star|singer|d', 'Pharaoh Flex|Limited: Desert Tour Legend|royal',
  'Lava Lamp Leo|Limited: Retro Funk Icon|dancer', 'Tidal Titania|Limited: Ocean Tour Queen|royal|d',
  'Voltage Vex|Limited: Arena Gamer Champ|gamer', 'Sunburst Sage|Limited: Summer Anthem Star|singer',
  // ---- 44 more (keep appending at the end so saved celeb ids never change) ----
  'Glacier Grace|Limited: Ice Show Star|dancer|d', 'Snowflake Sven|Limited: Winter Games Champ|athlete', 'Polar Penn|Limited: Arctic Explorer Star|astro',
  'Lantern Lin|Limited: Lantern Festival Dancer|dancer|d', 'Cupid Cass|Limited: Valentine Pop Star|singer|d', 'Carnival Caio|Limited: Carnival Samba King|dancer',
  'Clover Kip|Limited: Lucky Parade Host|host', 'Bloom Bianca|Limited: Spring Festival Diva|singer|d', 'Monsoon Mateo|Limited: Rainy Day Rocker|rock',
  'Rocket Rina|Limited: Launch Day Astronaut|astro|d', 'Petal Pop Priya|Limited: Blossom Pop Idol|singer|d', 'Dino Dara|Limited: Dino Park Presenter|host|d',
  'Nebula Nico|Limited: Space Tour Headliner|astro', 'Arcade Axel|Limited: Retro Arcade Champ|gamer', 'Wizard Wren|Limited: Wizard School Legend|magic|d',
  'Hero Hollis|Limited: Comic Con Hero|actor', 'Ninja Nami|Limited: Stealth Stunt Star|athlete|d', 'Robo Remix Rhys|Limited: Robot Dance Champ|dj',
  'Sandcastle Sora|Limited: Beach Party DJ|dj', 'Mermaid Marina|Limited: Underwater Show Star|singer|d', 'Heatwave Hana|Limited: Summer Surf Queen|athlete|d',
  'Firework Finn|Limited: Fireworks Show Star|magic', 'Popsicle Pablo|Limited: Ice Cream Truck Legend|chef', 'Captain Coral|Limited: High Seas Showman|royal',
  'Jungle Jaya|Limited: Jungle Expedition Star|influencer|d', 'Volcano Vic|Limited: Fire Dancer|dancer', 'Desert Dune Dax|Limited: Sand Dune Racer|athlete',
  'Hot Air Hazel|Limited: Balloon Race Champ|influencer|d', 'Boombox Bree|Limited: Old-School Hip-Hop Icon|dj|d', 'Disco Fever Dawn|Limited: Disco Revival Diva|singer|d',
  'Jazz Age Jules|Limited: Roaring Jazz Star|singer', 'Rockabilly Roy|Limited: Retro Rock Legend|rock', 'Thunderbolt Tia|Limited: Storm Chaser Star|host|d',
  'Harvest Holt|Limited: Country Fair Legend|cowboy', 'Maple Myles|Limited: Autumn Acoustic Star|rock', 'Pumpkin Patch Poppy|Limited: Spooky Season Star|magic|d',
  'Moonbeam Morgan|Limited: Haunted House Host|actor', 'Glitter Gala Gwen|Limited: Glam Rock Icon|rock|d', 'Medieval Merrick|Limited: Jousting Champion|athlete',
  'Feast Felix|Limited: Holiday Feast Chef|chef', 'Safari Sela|Limited: Wildlife TV Star|host|d', 'Jingle Jada|Limited: Holiday Pop Star|singer|d',
  'Countdown Cora|Limited: New Year Party Host|host|d', 'Grand Finale Grey|Limited: Season Finale Superstar|royal',
];
// Week-by-week rotation (week 1 = first Saturday of January). 52 weeks = a full year before any repeat.
const LIMITED_CALENDAR = [
  // January
  'Glacier Grace', 'Blizzard Belle', 'Snowflake Sven', 'Polar Penn',
  // February
  'Lantern Lin', 'Cupid Cass', 'Carnival Caio', 'Neon Noir',
  // March
  'Clover Kip', 'Bloom Bianca', 'Monsoon Mateo', 'Comet Carnival', 'Rocket Rina',
  // April
  'Petal Pop Priya', 'Dino Dara', 'Nebula Nico', 'Arcade Axel',
  // May
  'Wizard Wren', 'Hero Hollis', 'Ninja Nami', 'Robo Remix Rhys',
  // June
  'Sandcastle Sora', 'Mermaid Marina', 'Tidal Titania', 'Sunburst Sage', 'Heatwave Hana',
  // July
  'Firework Finn', 'Popsicle Pablo', 'Captain Coral', 'Jungle Jaya',
  // August
  'Volcano Vic', 'Desert Dune Dax', 'Pharaoh Flex', 'Hot Air Hazel', 'Boombox Bree',
  // September
  'Lava Lamp Leo', 'Disco Fever Dawn', 'Jazz Age Jules', 'Rockabilly Roy',
  // October
  'Thunderbolt Tia', 'Harvest Holt', 'Maple Myles', 'Pumpkin Patch Poppy', 'Moonbeam Morgan',
  // November
  'Voltage Vex', 'Glitter Gala Gwen', 'Medieval Merrick', 'Feast Felix',
  // December
  'Safari Sela', 'Jingle Jada', 'Countdown Cora', 'Grand Finale Grey',
];

// Archetypes of the original 21 celebs (same order as game.js CELEBS)
const ORIGINAL_ARCH = ['athlete', 'influencer', 'gamer', 'host', 'singer', 'dj', 'influencer', 'rock', 'chef', 'actor', 'singer',
  'singer', 'cowboy', 'actor', 'magic', 'athlete', 'astro', 'host', 'athlete', 'athlete', 'singer'];

// Daily theme days (0 = Sunday): matching archetypes spawn 4x more often.
export const THEME_DAYS = [
  { key: 'themeSun', arch: ['actor', 'model'] }, { key: 'themeMon', arch: ['athlete'] },
  { key: 'themeTue', arch: ['singer', 'rock', 'cowboy'] }, { key: 'themeWed', arch: ['influencer', 'gamer'] },
  { key: 'themeThu', arch: ['chef', 'host'] }, { key: 'themeFri', arch: ['dj', 'dancer'] },
  { key: 'themeSat', arch: ['royal', 'magic', 'astro'] },
];

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function makeLook(seed, tier, arch, dress) {
  const R = rng(seed * 9973 + 17), p = (a) => a[Math.floor(R() * a.length)];
  const cols = TIER_COLORS[tier];
  const acc = [...ARCH[arch]];
  if (arch === 'athlete') acc.push(p(ATHLETE_PROPS));
  const hasHat = () => acc.some((a) => HATS.includes(a));
  if (tier >= 3 && R() < 0.5 && !acc.includes('chain')) acc.push('chain');
  if (tier >= 4 && !hasHat() && R() < 0.45) acc.push(dress ? 'tiara' : 'crown');
  if (tier >= 5 && !acc.includes('cape')) acc.push('cape');
  if (tier >= 6 && !acc.includes('chain')) acc.push('chain');
  const top = p(cols);
  return {
    skin: p(SKINS), hair: p(HAIRS), hairStyle: hasHat() && R() < 0.5 ? 'short' : p(STYLES), top, bottom: dress ? top : p([0x222233, 0x2d3561, 0xffffff, 0x333333, p(cols)]),
    shoes: p([0xffffff, 0x111111, 0xffd700, 0xff3355]), dress: !!dress, acc, capeColor: p(cols), guitarColor: p([0xd35400, 0xe0a050, 0x111111, 0xff3355]),
    scale: tier >= 6 ? 1.32 : undefined,
  };
}
const parse = (s) => { const [name, title, arch, d] = s.split('|'); return { name, title, arch, dress: d === 'd' }; };
const sig = (n) => { const m = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / m) * m; };

export function extendCelebs(CELEBS) {
  CELEBS.forEach((c, i) => { c.arch = ORIGINAL_ARCH[i] || 'actor'; });
  T.forEach((list, tier) => {
    const [lo, hi] = COST[tier];
    list.forEach((s, i) => {
      const q = parse(s), cost = sig(lo * Math.pow(hi / lo, list.length > 1 ? i / (list.length - 1) : 0));
      CELEBS.push({ name: q.name, title: q.title, r: tier, cost, inc: Math.max(1, Math.round(cost / RATIO[tier])), arch: q.arch, look: makeLook(CELEBS.length, tier, q.arch, q.dress) });
    });
  });
  const exclusiveIds = [];
  for (const x of EXCLUSIVES) {
    const q = parse(x.e);
    exclusiveIds.push(CELEBS.length);
    CELEBS.push({ name: q.name, title: q.title, r: 6, cost: x.cost, inc: x.inc, arch: q.arch, look: makeLook(CELEBS.length, 6, q.arch, q.dress) });
  }
  const limitedIds = [];
  LIMITED.forEach((s, i) => {
    const q = parse(s); limitedIds.push(CELEBS.length);
    CELEBS.push({ name: q.name, title: q.title, r: 7, cost: 3e6 + (i % 8) * 7e5, inc: 3e4 + (i % 8) * 4e3, arch: q.arch, look: makeLook(CELEBS.length, 7, q.arch, q.dress) });
  });
  CELEBS.forEach((c, i) => (c.id = i));
  const byName = new Map(CELEBS.map((c) => [c.name, c]));
  const RECIPES = EXCLUSIVES.map((x, i) => {
    const need = x.need.map((n) => { const c = byName.get(n); if (!c) throw new Error('Recipe celeb missing: ' + n); return c.id; });
    return { result: exclusiveIds[i], need, fee: x.fee };
  });
  const rotation = LIMITED_CALENDAR.map((n) => { const c = byName.get(n); if (!c || c.r !== 7) throw new Error('Limited calendar celeb missing: ' + n); return c.id; });
  if (new Set(rotation).size !== limitedIds.length) throw new Error('Every Limited celeb must appear exactly once in the calendar');
  return { RECIPES, LIMITED_IDS: rotation, EXCLUSIVE_IDS: exclusiveIds };
}
