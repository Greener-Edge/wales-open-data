import re
def W(*ws): return re.compile(r'\b(?:'+'|'.join(ws)+r')',re.I)
EXCL=W(r'tobacco',r'cigar',r'cotton',r'wool',r'hides?\b',r'skins?\b',r'rubber',r'horses\b',r'asses\b',r'mules',r'camels',r'^cattle$',r'^sheep$',r'^goats$',r'swine',r'^pigs$',r'^chickens$',r'^ducks$',r'^turkeys$',r'^geese$',r'rabbits and hares$',r'live animals',r'other live',r'food wastes',r'crude organic',r'dog or cat',r'silk',r'jute',r'sisal',r'flax',r'hemp',r'fibre',r'fiber',r'furs?\b',r'beeswax',r'wax',r'gum',r'tallow',r'feathers',r'hair',r'pyrethrum',r'kapok',r'communion',r'ramie',r'coir',r'leather',r'bagasse',r'essential oils',r'chemically modified',r'industrial monocarboxylic',r'oil of castor',r'tung',r'spermaceti',r'wool grease',r'residues of fatty',r'manila')
G=[('spi',W(r'anise, badian')),('drk',W('wine','beer','spirit','alcohol','vermouth','cider','beverage','juice',r'waters?\b','mineral')),
('feed',W(r'cake of',r'bran of',r'for feed',r'forage',r'fodder',r'alfalfa',r'lucerne',r'dregs',r'cereal straw',r'gluten feed',r'meat meal',r'pulp, waste',r'germ of',r'screenings',r'flours and meals of oil',r'oilcake',r'hay\b',r'clover')),
('cof',W('coffee',r'tea\b','tea leaves',r'mat[eé]\b','cocoa','chocolate','sugar','confectionery','honey','molasses','syrup','glucose','fructose','isoglucose','maple')),
('dai',W('milk','cheese','butter','cream','yoghurt','yogurt',r'eggs?\b','whey','casein','lactose','ice cream','ghee','dairy')),
('mt',W('meat',r'pig meat',r'sausage','bacon','offals?','lard',r'fat of pigs',r'pig fat','poultry','beef','veal','game','liver','bovine','mutton')),
('oil',W('peanut',r'oils?\b','margarine','shortening',r'soya beans','soybean','rape','sunflower','groundnut','sesame','linseed','copra','coconut','shea','safflower','mustard','poppy',r'oil seeds',r'oilseeds',r'palm kernel',r'karite','jojoba','melonseed','hempseed',r'fats\b',r'hydrogenated')),
('fru',W('apple',r'pears?\b','quince','apricot','cherr','peach','nectarine',r'plums?\b','sloe','strawberr','raspberr','gooseberr','currant','blueberr','cranberr','berr',r'grapes?\b','kiwi','banana','plantain','orange','lemon','lime','tangerine','mandarin','clementine','grapefruit','citrus','pomelo','pineapple','mango','guava','papaya','avocado',r'dates?\b',r'figs?\b','persimmon','melon','watermelon','fruit','almond',r'nuts?\b','cashew','chestnut','hazelnut','pistachio','walnut','areca',r'kola',r'cola nuts','raisin','prune',r'olives?\b')),
('veg',W('potato','tomato','onion','garlic','cabbage','cauliflower','broccoli','lettuce','spinach','carrot','turnip','cucumber','chilli','aubergine','eggplant','pumpkin','squash','gourd','leek','asparagus','artichoke','mushroom','vegetable',r'beans?\b',r'peas?\b','lentil','chick','pulse','cassava','yam','taro','okra','celery','sweet corn','maize, green',r'roots?\b','tuber','manioc','sprout','chicory','kale','radish','beet','yautia','vetch','lupin')),
('cer',W('wheat','maize','rice','barley',r'oats?\b','rye','sorghum','millet','buckwheat','quinoa','cereal','flour','bread','pastry','pasta','biscuit','bulgur','malt','starch','gluten','grain','fonio','triticale','canary','breakfast','macaroni','dough','couscous','tapioca','bran')),
('spi',W('spice','pepper','vanilla','cinnamon','clove','nutmeg','ginger','anise','cumin','coriander','hop','herb','mint','saffron','turmeric','cardamom','mace','pimento','sauce','soup','vinegar','yeast','salt','condiment','preparation','infant','stimulant')),
]
def grp(item):
    if EXCL.search(item): return None
    for g,p in G:
        if p.search(item): return g
    return 'oth'
GN={'fru':'Fruit and nuts','veg':'Vegetables and pulses','mt':'Meat','dai':'Dairy and eggs','cer':'Cereals and bakery','oil':'Oils and oilseeds','cof':'Coffee, tea, cocoa and sugar','drk':'Drinks','feed':'Animal feed','spi':'Spices and prepared foods','oth':'Other'}
