(function () {
  const listHeroCards = [
    { slug: "adam-warlock", name: "Adam Warlock", bg: "#e29058", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d21.png?v=20241123" },
    { slug: "angela", name: "Angela", bg: "#ffb158", image: "https://r.res.easebar.com/pic/20250912/fb42acc6-da42-472d-bf2d-d7efd4dff5b5.png?v=20241123" },
    { slug: "black-cat", name: "Black Cat", bg: "#B79FFE", image: "https://r.res.easebar.com/pic/20260417/2c0db7d2-1232-44de-865b-4ce1a4f6b70e.png?v=20241123" },
    { slug: "black-panther", name: "Black Panther", bg: "#7c5a93", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d1.png?v=20241123" },
    { slug: "black-widow", name: "Black Widow", bg: "#6C7283", image: "https://r.res.easebar.com/pic/20241205/7e34f06f-150f-4ad3-8c86-2c7c73e95493.png?v=20241123" },
    { slug: "blade", name: "Blade", bg: "#ff6c67", image: "https://r.res.easebar.com/pic/20250808/d4aa1ebb-46cb-4ae8-ac82-611ea004609c.png?v=20241123" },
    { slug: "bruce-banner", name: "Bruce Banner", aliases: ["Hulk"], bg: "#4d8d6f", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d19.png?v=20241123" },
    { slug: "captain-america", name: "Captain America", bg: "#4e8bd0", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d24.png?v=20241123" },
    { slug: "cloak-dagger", name: "Cloak & Dagger", bg: "#a2b7fd", image: "https://r.res.easebar.com/pic/20241205/0f7b7427-3ff1-42d4-a965-3f35d4f49b51.png?v=20241123" },
    { slug: "daredevil", name: "Daredevil", bg: "#f0597d", image: "https://r.res.easebar.com/pic/20251011/bdf306ae-a908-495c-abcd-be4472db6620.png?v=20241123" },
    { slug: "deadpool", name: "Deadpool", bg: "#ff6c67", image: "https://r.res.easebar.com/pic/20260116/e877384d-6fa4-47d6-b040-f7300c7d0367.png?v=20241123" },
    { slug: "doctor-strange", name: "Doctor Strange", bg: "#fd7b73", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d2.png?v=20241123" },
    { slug: "elsa-bloodstone", name: "Elsa Bloodstone", bg: "#e86245", image: "https://r.res.easebar.com/pic/20260213/985677e8-fd80-47ed-96cc-8309404e71d0.png?v=20241123" },
    { slug: "emma-frost", name: "Emma Frost", bg: "#7aefff", image: "https://r.res.easebar.com/pic/20250408/8a48f02e-4525-42e9-b465-38e228aee7db.png?v=20241123" },
    { slug: "gambit", name: "Gambit", bg: "#ff97e0", image: "https://r.res.easebar.com/pic/20251115/a8e9881e-cc5b-4b01-99db-d83a4ced5aca.png?v=20241123" },
    { slug: "groot", name: "Groot", bg: "#9ec67a", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d3.png?v=20241123" },
    { slug: "hawkeye", name: "Hawkeye", bg: "#a482c4", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d27.png?v=20241123" },
    { slug: "hela", name: "Hela", bg: "#4da7a7", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d5.png?v=20241123" },
    { slug: "human-torch", name: "Human Torch", bg: "#e47263", image: "https://r.res.easebar.com/pic/20250220/d9c2e23d-53e8-4115-9ce1-008d22c5aa2e.png?v=20241123" },
    { slug: "invisible-woman", name: "Invisible Woman", bg: "#0ec4ff", image: "https://r.res.easebar.com/pic/20250113/c63fb614-e16c-46ce-877d-43317debebd5.png?v=20241123" },
    { slug: "iron-fist", name: "Iron Fist", bg: "#32b5a2", image: "https://r.res.easebar.com/pic/20241201/18ea989f-ba46-432d-93c3-87463215de53.png?v=20241123" },
    { slug: "iron-man", name: "Iron Man", bg: "#ff6680", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d6.png?v=20241123" },
    { slug: "jeff-the-land-shark", name: "Jeff the Land Shark", bg: "#7793c3", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d23.png?v=20241123" },
    { slug: "loki", name: "Loki", bg: "#62a173", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d7.png?v=20241123" },
    { slug: "luna-snow", name: "Luna Snow", bg: "#227ddf", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d18.png?v=20241123" },
    { slug: "magik", name: "Magik", bg: "#ab7977", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d12.png?v=20241123" },
    { slug: "magneto", name: "Magneto", bg: "#7167a4", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d11.png?v=20241123" },
    { slug: "mantis", name: "Mantis", bg: "#85a77e", image: "https://r.res.easebar.com/pic/20250131/e5b6506e-c783-4f2d-980d-83f167473b82.png?v=20241123" },
    { slug: "mister-fantastic", name: "Mister Fantastic", bg: "#2bc5ec", image: "https://r.res.easebar.com/pic/20250113/54cfc983-1e9d-45b5-9dcd-ff3228425347.png?v=20241123" },
    { slug: "moon-knight", name: "Moon Knight", bg: "#809ab0", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d26.png?v=20241123" },
    { slug: "namor", name: "Namor", bg: "#35afa5", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d20.png?v=20241123" },
    { slug: "peni-parker", name: "Peni Parker", bg: "#fe6d67", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d10.png?v=20241123" },
    { slug: "phoenix", name: "Phoenix", bg: "#fd7b73", image: "https://r.res.easebar.com/pic/20250711/570fc7a9-f109-4048-a997-ee40f292034d.png?v=20241123" },
    { slug: "psylocke", name: "Psylocke", bg: "#c672da", image: "https://r.res.easebar.com/pic/20241127/32976573-8ea6-401a-86bd-7931248cd94e.png?v=20241123" },
    { slug: "rocket-raccoon", name: "Rocket Raccoon", bg: "#f58b6a", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d8.png?v=20241123" },
    { slug: "rogue", name: "Rogue", bg: "#e4ca62", image: "https://r.res.easebar.com/pic/20251212/f6f6bb5a-a093-467a-9e1b-a34915911967.png?v=20241123" },
    { slug: "scarlet-witch", name: "Scarlet Witch", bg: "#f3597e", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d15.png?v=20241123" },
    { slug: "spider-man", name: "Spider-Man", bg: "#fc6775", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d13.png?v=20241123" },
    { slug: "squirrel-girl", name: "Squirrel Girl", bg: "#f4a366", image: "https://r.res.easebar.com/pic/20241201/aae04d93-a3ac-49d8-a8c3-bb9ab47b2bd9.png?v=20241123" },
    { slug: "star-lord", name: "Star-Lord", bg: "#6498e6", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d16.png?v=20241123" },
    { slug: "storm", name: "Storm", bg: "#5a6590", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d17.png?v=20241123" },
    { slug: "the-punisher", name: "The Punisher", bg: "#5f6a7e", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d4.png?v=20241123" },
    { slug: "the-thing", name: "The Thing", bg: "#fbb565", image: "https://r.res.easebar.com/pic/20250220/657d8eca-6d1f-4ad9-8c9a-99e1afac2a25.png?v=20241123" },
    { slug: "thor", name: "Thor", bg: "#707cc9", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d22.png?v=20241123" },
    { slug: "ultron", name: "Ultron", bg: "#8492bb", image: "https://r.res.easebar.com/pic/20250531/1ff03b44-8874-4962-a87a-19f2871f1e92.png?v=20241123" },
    { slug: "venom", name: "Venom", bg: "#3d4252", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d14.png?v=20241123" },
    { slug: "white-fox", name: "White Fox", bg: "#6edcde", image: "https://r.res.easebar.com/pic/20260320/a365b954-636c-4b3a-8dce-b81898cbda72.png?v=20241123" },
    { slug: "winter-soldier", name: "Winter Soldier", bg: "#727051", image: "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d25.png?v=20241123" },
    { slug: "wolverine", name: "Wolverine", bg: "#deb23d", image: "https://r.res.easebar.com/pic/20241205/04d0322f-e929-4b81-81e9-4817a3f221e1.png?v=20241123" },
  ];
  const heroCardsBySlug = new Map(listHeroCards.map((card) => [card.slug, card]));
  const heroCardsByName = new Map();
  const wikiHeroNormalImages = {
    "adam-warlock": "https://static.wikia.nocookie.net/marvel-rivals/images/7/7e/Adam_Warlock_Default_Costume_LoC_Icon.png/revision/latest?cb=20250108204921",
    "angela": "https://static.wikia.nocookie.net/marvel-rivals/images/c/cf/Angela_Default_Costume_LoC_Icon.png/revision/latest?cb=20250904173055",
    "black-cat": "https://static.wikia.nocookie.net/marvel-rivals/images/6/62/Black_Cat_Default_Costume_LoC_Icon.png/revision/latest?cb=20260417072738",
    "black-panther": "https://static.wikia.nocookie.net/marvel-rivals/images/4/48/Black_Panther_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229091841",
    "black-widow": "https://static.wikia.nocookie.net/marvel-rivals/images/4/4f/Black_Widow_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231014327",
    "blade": "https://static.wikia.nocookie.net/marvel-rivals/images/a/a2/Blade_Default_Costume_LoC_Icon.png/revision/latest?cb=20250906133610",
    "bruce-banner": "https://static.wikia.nocookie.net/marvel-rivals/images/7/73/Bruce_Banner_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231013528",
    "captain-america": "https://static.wikia.nocookie.net/marvel-rivals/images/5/5f/Captain_America_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229110133",
    "cloak-dagger": "https://static.wikia.nocookie.net/marvel-rivals/images/1/15/Cloak_%26_Dagger_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231020840",
    "daredevil": "https://static.wikia.nocookie.net/marvel-rivals/images/9/97/Daredevil_Default_Costume_LoC_Icon.png/revision/latest?cb=20251005053740",
    "deadpool": "https://static.wikia.nocookie.net/marvel-rivals/images/3/33/Deadpool_Default_Costume_LoC_Icon.png/revision/latest?cb=20260116052626",
    "doctor-strange": "https://static.wikia.nocookie.net/marvel-rivals/images/0/07/Doctor_Strange_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229115741",
    "elsa-bloodstone": "https://static.wikia.nocookie.net/marvel-rivals/images/7/7c/Elsa_Bloodstone_Default_Costume_LoC_Icon.png/revision/latest?cb=20260212180358",
    "emma-frost": "https://static.wikia.nocookie.net/marvel-rivals/images/9/9b/Emma_Frost_Default_Costume_LoC_Icon.png/revision/latest?cb=20250405220258",
    "gambit": "https://static.wikia.nocookie.net/marvel-rivals/images/5/53/Gambit_Hero_Card_Icon.png/revision/latest?cb=20251111191930",
    "groot": "https://static.wikia.nocookie.net/marvel-rivals/images/0/0a/Groot_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231022956",
    "hawkeye": "https://static.wikia.nocookie.net/marvel-rivals/images/c/c7/Hawkeye_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231024747",
    "hela": "https://static.wikia.nocookie.net/marvel-rivals/images/d/d1/Hela_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231031259",
    "human-torch": "https://static.wikia.nocookie.net/marvel-rivals/images/7/7a/Human_Torch_Default_Costume_LoC_Icon.png/revision/latest?cb=20250221122137",
    "invisible-woman": "https://static.wikia.nocookie.net/marvel-rivals/images/3/3a/Invisible_Woman_Default_Costume_LoC_Icon.png/revision/latest?cb=20250110210032",
    "iron-fist": "https://static.wikia.nocookie.net/marvel-rivals/images/9/9c/Iron_Fist_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229133135",
    "iron-man": "https://static.wikia.nocookie.net/marvel-rivals/images/c/c2/Iron_Man_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229140350",
    "jeff-the-land-shark": "https://static.wikia.nocookie.net/marvel-rivals/images/1/13/Jeff_the_Land_Shark_Default_Costume_LoC_Icon.png/revision/latest?cb=20251002175737",
    "loki": "https://static.wikia.nocookie.net/marvel-rivals/images/7/75/Loki_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229150156",
    "luna-snow": "https://static.wikia.nocookie.net/marvel-rivals/images/c/c9/Luna_Snow_Default_Costume_LoC_Icon.png/revision/latest?cb=20250906131645",
    "magik": "https://static.wikia.nocookie.net/marvel-rivals/images/d/dd/Magik_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229153727",
    "magneto": "https://static.wikia.nocookie.net/marvel-rivals/images/d/d2/Magneto_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229155646",
    "mantis": "https://static.wikia.nocookie.net/marvel-rivals/images/3/3d/Mantis_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229161852",
    "mister-fantastic": "https://static.wikia.nocookie.net/marvel-rivals/images/4/40/Mister_Fantastic_Default_Costume_LoC_Icon.png/revision/latest?cb=20250110202723",
    "moon-knight": "https://static.wikia.nocookie.net/marvel-rivals/images/f/ff/Moon_Knight_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229163510",
    "namor": "https://static.wikia.nocookie.net/marvel-rivals/images/7/7d/Namor_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231035855",
    "peni-parker": "https://static.wikia.nocookie.net/marvel-rivals/images/1/15/Peni_Parker_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229172118",
    "phoenix": "https://static.wikia.nocookie.net/marvel-rivals/images/d/de/Phoenix_Default_Costume_LoC_Icon.png/revision/latest?cb=20251114093544",
    "psylocke": "https://static.wikia.nocookie.net/marvel-rivals/images/6/63/Psylocke_Default_Costume_LoC_Icon.png/revision/latest?cb=20251005085642",
    "rocket-raccoon": "https://static.wikia.nocookie.net/marvel-rivals/images/d/d0/Rocket_Raccoon_Default_Costume_LoC_Icon.png/revision/latest?cb=20241229234352",
    "rogue": "https://static.wikia.nocookie.net/marvel-rivals/images/f/fe/Rogue_Default_Costume_LoC.png/revision/latest?cb=20251209182222",
    "scarlet-witch": "https://static.wikia.nocookie.net/marvel-rivals/images/e/ef/Scarlet_Witch_Default_Costume_LoC_Icon.png/revision/latest?cb=20250830175112",
    "spider-man": "https://static.wikia.nocookie.net/marvel-rivals/images/7/7a/Spider-Man_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230011539",
    "squirrel-girl": "https://static.wikia.nocookie.net/marvel-rivals/images/9/90/Squirrel_Girl_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230014520",
    "star-lord": "https://static.wikia.nocookie.net/marvel-rivals/images/f/f9/Star-Lord_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230021224",
    "storm": "https://static.wikia.nocookie.net/marvel-rivals/images/1/16/Storm_Default_Costume_LoC_Icon.png/revision/latest?cb=20251005060246",
    "the-punisher": "https://static.wikia.nocookie.net/marvel-rivals/images/1/15/The_Punisher_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230034350",
    "the-thing": "https://static.wikia.nocookie.net/marvel-rivals/images/e/e1/The_Thing_Default_Costume_LoC_Icon.png/revision/latest?cb=20250221153122",
    "thor": "https://static.wikia.nocookie.net/marvel-rivals/images/0/02/Thor_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230045604",
    "ultron": "https://static.wikia.nocookie.net/marvel-rivals/images/5/5e/Ultron_Default_Costume_LoC_Icon.png/revision/latest?cb=20250528130754",
    "venom": "https://static.wikia.nocookie.net/marvel-rivals/images/6/61/Venom_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230054945",
    "white-fox": "https://static.wikia.nocookie.net/marvel-rivals/images/a/a1/White_Fox_Default_Costume_LoC_Icon.png/revision/latest?cb=20260320024857",
    "winter-soldier": "https://static.wikia.nocookie.net/marvel-rivals/images/0/05/Winter_Soldier_Default_Costume_LoC_Icon.png/revision/latest?cb=20241230061335",
    "wolverine": "https://static.wikia.nocookie.net/marvel-rivals/images/f/f8/Wolverine_Default_Costume_LoC_Icon.png/revision/latest?cb=20241231043839",
  };
  const heroClassIcons = {
    duelist: "https://static.wikia.nocookie.net/marvel-rivals/images/5/58/Duelist_Icon.png/revision/latest?cb=20240819231214",
    strategist: "https://static.wikia.nocookie.net/marvel-rivals/images/e/e9/Strategist_Icon.png/revision/latest?cb=20240819231251",
    vanguard: "https://static.wikia.nocookie.net/marvel-rivals/images/c/ce/Vanguard_Icon.png/revision/latest?cb=20240819231325",
  };
  const cardLayerImages = {
    normalBg: "img/layers/hero-card-bg.png",
    normalFooter: "https://static.wikia.nocookie.net/marvel-rivals/images/9/9b/Hero_Card_Top_Layer.png/revision/latest?cb=20250719231609",
    hoverBg1: "img/layers/hero-card-hover-bg-1.png",
    hoverBg2: "img/layers/hero-card-hover-bg2.png",
    hoverFooter: "img/layers/hero-card-hover-top-layer.png",
    hoverOutline: "img/layers/hero-card-outline.png",
    hoverShadow: "img/layers/hero-card-hover-shadow.png",
  };
  const strategistHeroes = new Set([
    "adam-warlock", "cloak-dagger", "gambit", "invisible-woman", "jeff-the-land-shark",
    "loki", "luna-snow", "mantis", "rocket-raccoon", "ultron", "white-fox",
  ]);
  const vanguardHeroes = new Set([
    "angela", "bruce-banner", "captain-america", "deadpool", "doctor-strange",
    "emma-frost", "groot", "magneto", "peni-parker", "rogue", "the-thing",
    "thor", "venom",
  ]);

  function classIconForSlug(slug) {
    if (strategistHeroes.has(slug)) {
      return heroClassIcons.strategist;
    }

    if (vanguardHeroes.has(slug)) {
      return heroClassIcons.vanguard;
    }

    return heroClassIcons.duelist;
  }

  const wikiHeroHoverImages = {
    "adam-warlock": "https://static.wikia.nocookie.net/marvel-rivals/images/b/b0/Hero_Card_Adam_Warlock.png/revision/latest?cb=20250721203513",
    "angela": "https://static.wikia.nocookie.net/marvel-rivals/images/3/3d/Angela_Hero_Card.png/revision/latest?cb=20250904172816",
    "black-cat": "https://static.wikia.nocookie.net/marvel-rivals/images/3/3e/Hero_Card_Black_Cat.png/revision/latest?cb=20260414180824",
    "black-panther": "https://static.wikia.nocookie.net/marvel-rivals/images/0/0b/Hero_Card_Black_Panther.png/revision/latest?cb=20250721204129",
    "black-widow": "https://static.wikia.nocookie.net/marvel-rivals/images/7/7b/Hero_Card_Black_Widow.png/revision/latest?cb=20250721204440",
    "blade": "https://static.wikia.nocookie.net/marvel-rivals/images/b/be/Blade_Hero_Card.png/revision/latest?cb=20250901135733",
    "bruce-banner": "https://static.wikia.nocookie.net/marvel-rivals/images/a/a9/Hulk_Hero_Card.png/revision/latest?cb=20250721213026",
    "captain-america": "https://static.wikia.nocookie.net/marvel-rivals/images/b/b8/Hero_Card_Captain_America.png/revision/latest?cb=20250721203644",
    "cloak-dagger": "https://static.wikia.nocookie.net/marvel-rivals/images/c/c6/Hero_Card_Cloak_%26_Dagger.png/revision/latest?cb=20250721204645",
    "daredevil": "https://static.wikia.nocookie.net/marvel-rivals/images/b/b9/Daredevil_Hero_Card.png/revision/latest?cb=20251002103833",
    "deadpool": "https://static.wikia.nocookie.net/marvel-rivals/images/a/a3/Hero_Card_Deadpool.png/revision/latest?cb=20260114201646",
    "doctor-strange": "https://static.wikia.nocookie.net/marvel-rivals/images/5/5d/Hero_Card_Doctor_Strange.png/revision/latest?cb=20260429225837",
    "elsa-bloodstone": "https://static.wikia.nocookie.net/marvel-rivals/images/8/8b/Hero_Card_Elsa_Bloodstone.png/revision/latest?cb=20260210174555",
    "emma-frost": "https://static.wikia.nocookie.net/marvel-rivals/images/b/bd/Hero_Card_Emma_Frost.png/revision/latest?cb=20250721205343",
    "gambit": "https://static.wikia.nocookie.net/marvel-rivals/images/3/3b/Gambit_Hero_Card.png/revision/latest?cb=20251111190350",
    "groot": "https://static.wikia.nocookie.net/marvel-rivals/images/2/2a/Hero_Card_Groot.png/revision/latest?cb=20250721205632",
    "hawkeye": "https://static.wikia.nocookie.net/marvel-rivals/images/1/15/Hero_Card_Hawkeye.png/revision/latest?cb=20250721205834",
    "hela": "https://static.wikia.nocookie.net/marvel-rivals/images/3/33/Hela_Prestige_Artwork.png/revision/latest?cb=20240818131928",
    "human-torch": "https://static.wikia.nocookie.net/marvel-rivals/images/6/6e/Hero_Card_Human_Torch.png/revision/latest?cb=20250721214839",
    "invisible-woman": "https://static.wikia.nocookie.net/marvel-rivals/images/d/da/Hero_Card_Invisible_Woman.png/revision/latest?cb=20250721220206",
    "iron-fist": "https://static.wikia.nocookie.net/marvel-rivals/images/2/26/Prestigeironfist.png/revision/latest?cb=20250103042504",
    "iron-man": "https://static.wikia.nocookie.net/marvel-rivals/images/b/bf/Iron_man_prestige.png/revision/latest?cb=20250118091616",
    "jeff-the-land-shark": "https://static.wikia.nocookie.net/marvel-rivals/images/0/06/Hero_Card_Jeff.png/revision/latest?cb=20250721230023",
    "loki": "https://static.wikia.nocookie.net/marvel-rivals/images/c/cd/Hero_Card_Loki.png/revision/latest?cb=20250721234424",
    "luna-snow": "https://static.wikia.nocookie.net/marvel-rivals/images/0/0b/Hero_Card_Luna_Snow.png/revision/latest?cb=20250721234908",
    "magik": "https://static.wikia.nocookie.net/marvel-rivals/images/0/05/Magik_marvel_rivals_prestige_art.png/revision/latest?cb=20250210093153",
    "magneto": "https://static.wikia.nocookie.net/marvel-rivals/images/f/fb/Magneto_prestige.png/revision/latest?cb=20250118091321",
    "mantis": "https://static.wikia.nocookie.net/marvel-rivals/images/c/ca/Hero_Card_Mantis.png/revision/latest?cb=20250721235840",
    "mister-fantastic": "https://static.wikia.nocookie.net/marvel-rivals/images/f/f0/Hero_Card_Mister_Fantastic.png/revision/latest?cb=20250722001652",
    "moon-knight": "https://static.wikia.nocookie.net/marvel-rivals/images/f/fc/Moonknight_prestige.png/revision/latest?cb=20250103042540",
    "namor": "https://static.wikia.nocookie.net/marvel-rivals/images/3/38/Namor_prestige.png/revision/latest?cb=20250118093830",
    "peni-parker": "https://static.wikia.nocookie.net/marvel-rivals/images/6/6a/Peni_Parker_Prestige_Artwork.png/revision/latest?cb=20240818132836",
    "phoenix": "https://static.wikia.nocookie.net/marvel-rivals/images/6/6c/Phoenix_prestige.png/revision/latest?cb=20250712012648",
    "psylocke": "https://static.wikia.nocookie.net/marvel-rivals/images/e/e3/Hero_Card_Psylocke.png/revision/latest?cb=20250722001409",
    "rocket-raccoon": "https://static.wikia.nocookie.net/marvel-rivals/images/3/35/Hero_Card_Rocket_Raccoon.png/revision/latest?cb=20250722002115",
    "rogue": "https://static.wikia.nocookie.net/marvel-rivals/images/9/98/Rogue_Hero_Card.png/revision/latest?cb=20251209182604",
    "scarlet-witch": "https://static.wikia.nocookie.net/marvel-rivals/images/a/a5/Hero_Card_Scarlet_Witch.png/revision/latest?cb=20250722002354",
    "spider-man": "https://static.wikia.nocookie.net/marvel-rivals/images/e/ec/Hero_Card_Spider-Man.png/revision/latest?cb=20250722002837",
    "squirrel-girl": "https://static.wikia.nocookie.net/marvel-rivals/images/f/f4/Prestige_squirellgirl.png/revision/latest?cb=20250103042513",
    "star-lord": "https://static.wikia.nocookie.net/marvel-rivals/images/e/ef/Hero_Card_Star-Lord.png/revision/latest?cb=20250722003309",
    "storm": "https://static.wikia.nocookie.net/marvel-rivals/images/1/1d/Hero_Card_Storm.png/revision/latest?cb=20250722003711",
    "the-punisher": "https://static.wikia.nocookie.net/marvel-rivals/images/c/c2/Punisher_prestige.png/revision/latest?cb=20250118091123",
    "the-thing": "https://static.wikia.nocookie.net/marvel-rivals/images/9/9a/The_Thing_Prestige_art.png/revision/latest?cb=20250222105025",
    "thor": "https://static.wikia.nocookie.net/marvel-rivals/images/0/0a/Hero_Card_Thor.png/revision/latest?cb=20250722004447",
    "ultron": "https://static.wikia.nocookie.net/marvel-rivals/images/8/86/Ultron_Prestige_art.png/revision/latest?cb=20250525052352",
    "venom": "https://static.wikia.nocookie.net/marvel-rivals/images/c/c7/Hero_Card_Venom.png/revision/latest?cb=20250722005205",
    "white-fox": "https://static.wikia.nocookie.net/marvel-rivals/images/3/34/Hero_Card_White_Fox.png/revision/latest?cb=20260317174853",
    "winter-soldier": "https://static.wikia.nocookie.net/marvel-rivals/images/2/2b/Winter_soldier_prestige.png/revision/latest?cb=20250118091928",
    "wolverine": "https://static.wikia.nocookie.net/marvel-rivals/images/d/db/Hero_Card_Wolverine.png/revision/latest?cb=20250722005649",
  };

  listHeroCards.forEach((card) => {
    card.normalImage = wikiHeroNormalImages[card.slug] || card.image;
    card.hoverImage = wikiHeroHoverImages[card.slug] || null;
    card.classIcon = classIconForSlug(card.slug);
    heroCardsByName.set(normalizeHeroName(card.name), card);
    (card.aliases || []).forEach((alias) => {
      heroCardsByName.set(normalizeHeroName(alias), card);
    });
  });

  const mountTarget = document.getElementById("hzu18-hero-selection-mount");

  if (!mountTarget || !window.init) {
    return;
  }

  const urlRoot = window.init.urlRoot || "";
  const pluginAssetRoot = `${urlRoot}/plugins/hzu18_marvel_rivals/assets/`;

  const panel = document.createElement("section");
  panel.className = "hzu18-hero-panel mb-4";
  mountTarget.innerHTML = "";
  mountTarget.appendChild(panel);

  let payload = null;
  let selectedHeroId = null;
  let loading = true;
  let confirming = false;
  let error = null;
  let refreshTimer = null;
  let eventSource = null;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : null;
  }

  function syncConfirmedSelection() {
    if (!payload) {
      selectedHeroId = null;
      return;
    }

    if (payload.confirmed && payload.selected) {
      selectedHeroId = payload.selected.id;
      return;
    }

    if (!payload.can_pick) {
      selectedHeroId = null;
    }
  }

  function selectedHero() {
    if (!payload) {
      return null;
    }

    if (payload.selected) {
      return payload.selected;
    }

    return (payload.heroes || []).find((hero) => hero.id === selectedHeroId) || null;
  }

  function selectedHeroClaimedByOther() {
    const hero = selectedHero();
    return Boolean(hero && hero.claimed && !hero.claimed_by_current_team);
  }

  function canConfirmSelection() {
    return Boolean(
      payload &&
        payload.can_pick &&
        selectedHeroId &&
        !confirming &&
        !selectedHeroClaimedByOther(),
    );
  }

  function normalizeHeroName(value) {
    return String(value || "")
      .replace(/&amp;/g, "&")
      .trim()
      .toLowerCase();
  }

  function fallbackCardFor(hero, index) {
    return (
      heroCardsBySlug.get(hero.slug) ||
      heroCardsByName.get(normalizeHeroName(hero.name)) ||
      listHeroCards[index % listHeroCards.length]
    );
  }

  function displayImageUrl(value) {
    if (!value) {
      return "";
    }

    if (/^(https?:|data:|\/)/i.test(value)) {
      return value;
    }

    return `${pluginAssetRoot}${value}`;
  }

  function renderLayerImage(className, url) {
    return `<span class="${className}" aria-hidden="true"><img src="${escapeHtml(displayImageUrl(url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`;
  }

  function renderHeroCard(hero, index) {
    const selected = selectedHeroId === hero.id;
    const claimedByOtherTeam = hero.claimed && !hero.claimed_by_current_team;
    const disabled =
      !payload.can_pick ||
      confirming ||
      claimedByOtherTeam;
    const fallbackCard = fallbackCardFor(hero, index);
    const color = safeColor(hero.theme_color) || fallbackCard.bg;
    const portraitPath = fallbackCard.normalImage || fallbackCard.image;
    const portrait = portraitPath
      ? `<img src="${escapeHtml(displayImageUrl(portraitPath))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
      : "";
    const classIcon = fallbackCard.classIcon
      ? `<span class="herocard-class"><img src="${escapeHtml(displayImageUrl(fallbackCard.classIcon))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`
      : "";
    const hoverPortrait = fallbackCard.hoverImage
      ? `<span class="herocard-bg-hover"><span class="herocard-hover-color-bg" aria-hidden="true"></span>${renderLayerImage("herocard-hover-bg1", cardLayerImages.hoverBg1)}${renderLayerImage("herocard-hover-bg2", cardLayerImages.hoverBg2)}<span class="herocard-img herocard-img--hover"><img src="${escapeHtml(
          displayImageUrl(fallbackCard.hoverImage),
        )}" alt="" loading="eager" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" onerror="this.closest('.herocard-char').classList.add('has-no-hover-image')"></span>${renderLayerImage("herocard-footer herocard-footer--hover", cardLayerImages.hoverFooter)}</span>`
      : "";
    const title = claimedByOtherTeam
      ? `${hero.name} is already picked`
      : hero.name;
    const ariaLabel = claimedByOtherTeam
      ? `${hero.name} is already picked by another team`
      : `Choose ${hero.name}`;

    return `
      <button
        class="hzu18-hero-card herocard-wrapper ${selected ? "is-selected" : ""} ${
          claimedByOtherTeam ? "is-claimed" : ""
        } ${disabled ? "is-disabled" : ""}"
        type="button"
        data-hero-id="${hero.id}"
        data-index="${index}"
        data-disabled="${disabled ? "true" : "false"}"
        title="${escapeHtml(title)}"
        aria-label="${escapeHtml(ariaLabel)}"
        aria-disabled="${disabled ? "true" : "false"}"
        style="--hzu18-hero-color: ${color}; --herocard-bg: ${color}; --imgx: 0px; --imgy: 0px;"
      >
        ${renderLayerImage("herocard-hover-shadow", cardLayerImages.hoverShadow)}
        ${renderLayerImage("herocard-hover-outline", cardLayerImages.hoverOutline)}
        <span class="herocard-char ${hoverPortrait ? "has-hover-image" : ""}">
          <span class="herocard-bg-normal">
            ${renderLayerImage("herocard-normal-bg", cardLayerImages.normalBg)}
            <span class="herocard-img herocard-img--normal">${portrait}</span>
            ${renderLayerImage("herocard-footer", cardLayerImages.normalFooter)}
          </span>
          ${hoverPortrait}
          <span class="herocard-name">${escapeHtml(hero.name)}</span>
          ${classIcon}
        </span>
      </button>
    `;
  }

  function render() {
    if (loading) {
      panel.innerHTML = `
        <div class="hzu18-hero-panel__body">
          <p class="hzu18-hero-panel__empty">Loading heroes...</p>
        </div>
      `;
      return;
    }

    if (error && !payload) {
      panel.innerHTML = `
        <div class="hzu18-hero-panel__body">
          <div class="alert alert-danger mb-0" role="alert">${escapeHtml(error)}</div>
        </div>
      `;
      return;
    }

    const heroes = payload.heroes || [];
    const actionError = error
      ? `<div class="alert alert-danger hzu18-hero-panel__alert" role="alert">${escapeHtml(error)}</div>`
      : "";
    const confirmDisabled = !canConfirmSelection();
    const confirmButton = payload.is_captain
      ? `
        <button
          class="hzu18-hero-confirm ${payload.confirmed ? "is-confirmed" : ""}"
          type="button"
          data-confirm-hero
          ${confirmDisabled ? "disabled" : ""}
        >
          ${payload.confirmed ? "Confirmed" : confirming ? "Confirming..." : "Confirm"}
        </button>
      `
      : "";

    panel.innerHTML = `
      <div class="hzu18-hero-panel__body">
        ${actionError}
        ${
          heroes.length
            ? `<div class="hzu18-hero-grid">${heroes.map(renderHeroCard).join("")}</div>`
            : `<p class="hzu18-hero-panel__empty">No heroes are enabled yet.</p>`
        }
      </div>
      ${confirmButton}
    `;
  }

  async function requestJson(path, options) {
    const response = await fetch(`${urlRoot}${path}`, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "CSRF-Token": window.init.csrfNonce,
      },
      ...options,
    });
    const body = await response.json();

    if (!response.ok || body.success === false) {
      const errors = body.errors || {};
      const firstKey = Object.keys(errors)[0];
      const firstError = firstKey
        ? errors[firstKey][0] || errors[firstKey]
        : null;
      throw new Error(firstError || "Hero selection request failed");
    }

    return body.data;
  }

  async function load() {
    loading = true;
    error = null;
    render();

    try {
      payload = await requestJson("/api/v1/hzu18/team/hero", { method: "GET" });
      syncConfirmedSelection();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
      render();
    }
  }

  async function refreshPayload() {
    try {
      payload = await requestJson("/api/v1/hzu18/team/hero", { method: "GET" });
      syncConfirmedSelection();
      render();
    } catch (_) {
      // The next manual action will surface the connection error if it persists.
    }
  }

  function queueRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshPayload, 150);
  }

  function startEventRefresh() {
    if (!window.EventSource) {
      return;
    }

    eventSource = new EventSource(`${urlRoot}/api/v1/hzu18/events?replay=0`);
    eventSource.addEventListener("hero_selected", queueRefresh);
  }

  function selectHero(heroId) {
    selectedHeroId = heroId;
    error = null;
    render();
  }

  async function confirmHero() {
    confirming = true;
    error = null;
    render();

    try {
      payload = await requestJson("/api/v1/hzu18/team/hero/confirm", {
        method: "POST",
        body: JSON.stringify({ hero_id: selectedHeroId }),
      });
      syncConfirmedSelection();
    } catch (err) {
      error = err.message;
      await refreshPayload();
    } finally {
      confirming = false;
      render();
    }
  }

  panel.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const confirmButton = event.target.closest("[data-confirm-hero]");
    if (confirmButton) {
      if (confirmButton.disabled || !canConfirmSelection()) {
        return;
      }
      confirmHero();
      return;
    }

    const button = event.target.closest("[data-hero-id]");
    if (
      !button ||
      button.getAttribute("data-disabled") === "true" ||
      !payload ||
      !payload.can_pick
    ) {
      return;
    }
    selectHero(Number(button.getAttribute("data-hero-id")));
  });

  window.addEventListener("beforeunload", () => {
    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
    }

    if (eventSource) {
      eventSource.close();
    }
  });

  load();
  startEventRefresh();
})();
