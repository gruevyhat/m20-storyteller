// Training names for the Markov name generator, grouped by naming tradition. These are ordinary
// given names and surnames; the generator never returns one of them unchanged.

export interface Corpus {
  key: string;
  label: string;
  given: string[];
  family: string[];
  /** Lower-case surname particles ("van", "de") added to some generated surnames. */
  particles?: { list: string[]; chance: number };
}

export const CORPORA: Corpus[] = [
  {
    key: 'british',
    label: 'English & Scots',
    given: [
      'Alistair', 'Bridget', 'Catriona', 'Duncan', 'Eileen', 'Fiona', 'Graham', 'Hamish', 'Isla', 'James', 'Kenneth', 'Lorna', 'Malcolm',
      'Moira', 'Niall', 'Rhona', 'Struan', 'Thomas', 'Una', 'Agnes', 'Edith', 'Harold', 'Margaret', 'Walter', 'Winifred', 'Arthur',
      'Beatrice', 'Cecil', 'Dorothy', 'Eleanor', 'Frederick', 'Gwendolyn', 'Henry', 'Imogen', 'Josephine', 'Lionel', 'Mabel', 'Nigel',
      'Oswald', 'Penelope', 'Rosalind', 'Simon', 'Theodore', 'Vivian', 'Wilfred', 'Ada', 'Lillian', 'Martin', 'Nora', 'Owen', 'Ruth',
      'Samuel', 'Victoria', 'Clara', 'Edmund', 'Gordon', 'Heather', 'Iain', 'Jean', 'Kirsty', 'Morag', 'Ross', 'Ewan', 'Ailsa', 'Callum',
      'Alfred', 'Annabel', 'Barnaby', 'Charlotte', 'Cuthbert', 'Daphne', 'Edwin', 'Florence', 'Geoffrey', 'Harriet', 'Hugh', 'Isobel',
      'Jasper', 'Judith', 'Kathleen', 'Leonard', 'Lucinda', 'Marjorie', 'Montague', 'Nathaniel', 'Olive', 'Percival', 'Phoebe', 'Rupert',
      'Rowena', 'Sebastian', 'Sybil', 'Tobias', 'Ursula', 'Violet', 'Wallace', 'Bernard', 'Cordelia', 'Douglas', 'Elspeth', 'Fergus',
      'Gillian', 'Hector', 'Innes', 'Jessamy', 'Lachlan', 'Muriel', 'Neville', 'Quentin', 'Rosamund', 'Sholto', 'Tristram', 'Wendy',
    ],
    family: [
      'Abernethy', 'Blackwood', 'Cameron', 'Drummond', 'Ferguson', 'Galbraith', 'Inglis', 'Kerr', 'Lennox', 'MacAllister', 'Munro',
      'Ogilvie', 'Pringle', 'Ramsay', 'Sinclair', 'Thornton', 'Urquhart', 'Wallace', 'Ashdown', 'Barrow', 'Carver', 'Dunmore', 'Ellery',
      'Fairweather', 'Granger', 'Holloway', 'Kingsley', 'Marsh', 'Netherton', 'Pemberton', 'Radcliffe', 'Stanhope', 'Thackeray',
      'Whitlock', 'Aldridge', 'Bramwell', 'Crowther', 'Hargreaves', 'Lockhart', 'Moffat', 'Rutherford', 'Waddell', 'Haddow', 'Kinnear',
      'Lindsay', 'Maxwell', 'Shearer', 'Tennant', 'Buchanan', 'Crawford', 'Dalgleish', 'Gilchrist', 'Halliday', 'McCrae', 'Pettigrew',
      'Ainsworth', 'Ashby', 'Beckett', 'Blackburn', 'Bradshaw', 'Chatterley', 'Cholmondeley', 'Davenport', 'Elphinstone', 'Fairfax',
      'Fenwick', 'Gresham', 'Hawthorne', 'Hepworth', 'Ingram', 'Jessop', 'Kettering', 'Langley', 'Mortimer', 'Northcott', 'Oakley',
      'Pennington', 'Quarrington', 'Rowntree', 'Sedgwick', 'Thistlewood', 'Underhill', 'Wetherby', 'Winterbottom', 'Yardley', 'Cartwright',
      'Featherstone', 'Hollingsworth', 'Kirkpatrick', 'Lyndon', 'Mallory', 'Prescott', 'Stoddart', 'Treadwell', 'Wainwright',
    ],
  },
  {
    key: 'american',
    label: 'American',
    given: [
      'Abigail', 'Amos', 'Beverly', 'Bobby', 'Brenda', 'Calvin', 'Carol', 'Chester', 'Clifford', 'Cynthia', 'Darlene', 'Dale', 'Dwight',
      'Earl', 'Ellen', 'Everett', 'Floyd', 'Gail', 'Gary', 'Gloria', 'Harlan', 'Hazel', 'Irene', 'Jack', 'Janet', 'Jesse', 'Judy', 'Karen',
      'Kenny', 'Laverne', 'Leroy', 'Linda', 'Lyle', 'Marlene', 'Marvin', 'Maxine', 'Mitchell', 'Nancy', 'Norman', 'Opal', 'Patricia',
      'Randall', 'Roberta', 'Ronnie', 'Roy', 'Sandra', 'Sherman', 'Shirley', 'Terry', 'Travis', 'Vernon', 'Wanda', 'Wayne', 'Wilbur',
      'Clayton', 'Delbert', 'Earline', 'Faye', 'Garrett', 'Jolene', 'Loretta', 'Merle', 'Rhonda', 'Tammy', 'Virgil',
    ],
    family: [
      'Anderson', 'Baker', 'Barnes', 'Bennett', 'Brooks', 'Carter', 'Coleman', 'Collins', 'Cooper', 'Davis', 'Dawson', 'Ellis', 'Foster',
      'Gibson', 'Graham', 'Hayes', 'Henderson', 'Hudson', 'Hughes', 'Jenkins', 'Johnson', 'Kelley', 'Lawson', 'Mason', 'Mitchell',
      'Morgan', 'Murray', 'Nelson', 'Parker', 'Patterson', 'Perkins', 'Porter', 'Powell', 'Reed', 'Reynolds', 'Russell', 'Sanders',
      'Shelby', 'Simmons', 'Stewart', 'Sullivan', 'Thompson', 'Tucker', 'Turner', 'Walker', 'Warren', 'Watkins', 'Webb', 'Wheeler',
      'Whitaker', 'Whitfield', 'Wilkins', 'Bradford', 'Calhoun', 'Dempsey', 'Garrison', 'Holcomb', 'McAllister', 'Pruitt', 'Sutton',
    ],
  },
  {
    key: 'czech',
    label: 'Czech & Slavic',
    given: [
      'Anežka', 'Bohdan', 'Dagmar', 'Daniela', 'Eliška', 'František', 'Hana', 'Ivana', 'Jaroslav', 'Jiří', 'Kateřina', 'Ladislav',
      'Libuše', 'Lucie', 'Marek', 'Milada', 'Miroslav', 'Ondřej', 'Pavel', 'Radek', 'Radka', 'Stanislav', 'Tereza', 'Václav', 'Vojtěch',
      'Zdeněk', 'Zuzana', 'Božena', 'Vlasta', 'Jindřich', 'Kamil', 'Lenka', 'Olga', 'Petr', 'Romana', 'Tomáš', 'Věra', 'Vít', 'Anna',
      'Bořivoj', 'Dobromila', 'Karel', 'Ludmila', 'Milena', 'Přemysl', 'Svatopluk', 'Vladimíra', 'Zbyněk', 'Jarmila', 'Oldřich',
    ],
    family: [
      'Novák', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný', 'Růžička', 'Beneš', 'Fiala', 'Sedláček',
      'Doležal', 'Zeman', 'Kolář', 'Navrátil', 'Čermák', 'Vaněk', 'Urban', 'Blažek', 'Kříž', 'Kovář', 'Bartoš', 'Vlček', 'Polák', 'Musil',
      'Šimek', 'Holub', 'Konečný', 'Malý', 'Štěpánek', 'Havlíček', 'Hrubý', 'Kopecký', 'Moravec', 'Tichý', 'Šťastný', 'Vacek', 'Jelínek',
      'Kratochvíl', 'Mareš', 'Pospíšil', 'Skála', 'Toman', 'Vondráček', 'Žák',
    ],
  },
  {
    key: 'hispanic',
    label: 'Spanish & Latin American',
    given: [
      'Alejandro', 'Beatriz', 'Carmen', 'Dolores', 'Esteban', 'Fernanda', 'Gabriel', 'Hernán', 'Inés', 'Javier', 'Lucía', 'Mateo',
      'Nicolás', 'Octavio', 'Paloma', 'Ramón', 'Rosario', 'Santiago', 'Teresa', 'Ulises', 'Valentina', 'Ximena', 'Yolanda', 'Adriana',
      'Benito', 'Consuelo', 'Diego', 'Elena', 'Felipe', 'Graciela', 'Ignacio', 'Joaquín', 'Leonor', 'Manuel', 'Natalia', 'Pilar',
      'Rafael', 'Soledad', 'Tomás', 'Amparo', 'Eduardo', 'Guadalupe', 'Lorenzo', 'Mercedes', 'Rodrigo', 'Silvia', 'Wenceslao',
    ],
    family: [
      'Acosta', 'Bermúdez', 'Castillo', 'Delgado', 'Escobar', 'Figueroa', 'Guzmán', 'Herrera', 'Ibarra', 'Jiménez', 'Lozano', 'Medina',
      'Navarro', 'Ortega', 'Pacheco', 'Quintero', 'Robles', 'Salazar', 'Tejada', 'Urrutia', 'Valdez', 'Zamora', 'Aguilar', 'Beltrán',
      'Cervantes', 'Domínguez', 'Espinoza', 'Fuentes', 'Gallardo', 'Iglesias', 'Luna', 'Maldonado', 'Morales', 'Paredes', 'Rivera',
      'Sandoval', 'Vargas', 'Villanueva', 'Ybarra', 'Cordero', 'Arellano', 'Cisneros', 'Montoya', 'Peralta', 'Solís',
    ],
  },
  {
    key: 'italian',
    label: 'Italian',
    given: [
      'Alessandra', 'Bruno', 'Carlo', 'Donatella', 'Enzo', 'Francesca', 'Giacomo', 'Ilaria', 'Lorenzo', 'Marcella', 'Niccolò', 'Ottavia',
      'Paolo', 'Rosalba', 'Salvatore', 'Tiziana', 'Umberto', 'Vittoria', 'Agostino', 'Bianca', 'Cesare', 'Domenico', 'Elisabetta',
      'Fabrizio', 'Gemma', 'Leonardo', 'Lucia', 'Massimo', 'Nunzia', 'Orazio', 'Pietro', 'Raffaella', 'Sergio', 'Teodora', 'Valerio',
      'Annunziata', 'Concetta', 'Gianluca', 'Ludovica', 'Ottorino',
    ],
    family: [
      'Abate', 'Bellini', 'Caruso', 'De Luca', 'Esposito', 'Ferrante', 'Galli', 'Lombardi', 'Mancini', 'Marchetti', 'Moretti', 'Palumbo',
      'Rinaldi', 'Russo', 'Santoro', 'Testa', 'Vitale', 'Zanetti', 'Amato', 'Barbieri', 'Colombo', "D'Angelo", 'Fabbri', 'Gentile', 'Greco',
      'Leone', 'Mariani', 'Pellegrini', 'Ricci', 'Serra', 'Villa', 'Costa', 'Fontana', 'Monti', 'Benedetti', 'Cattaneo', 'Ferraro',
      'Giordano', 'Orlando', 'Sartori',
    ],
  },
  {
    key: 'west-african',
    label: 'West African',
    given: [
      'Adaeze', 'Babajide', 'Chidi', 'Chinwe', 'Folake', 'Ifeoma', 'Kwame', 'Kofi', 'Akosua', 'Abena', 'Emeka', 'Ngozi', 'Obinna',
      'Oluwaseun', 'Tobenna', 'Yaw', 'Ama', 'Efua', 'Kwabena', 'Nnamdi', 'Adebayo', 'Temitope', 'Uchenna', 'Amara', 'Ekene', 'Funmilayo',
      'Ikenna', 'Kelechi', 'Nkechi', 'Olumide', 'Adwoa', 'Bisola', 'Chiamaka', 'Dayo', 'Esi', 'Femi', 'Kojo', 'Yetunde',
    ],
    family: [
      'Adeyemi', 'Mensah', 'Owusu', 'Boateng', 'Nwosu', 'Eze', 'Okonkwo', 'Asante', 'Agyeman', 'Danso', 'Obi', 'Afolabi', 'Balogun',
      'Chukwu', 'Ibekwe', 'Okoro', 'Osei', 'Ofori', 'Darko', 'Nwachukwu', 'Oyelaran', 'Akinola', 'Anyanwu', 'Ekwueme', 'Opoku', 'Quaye',
      'Adjei', 'Babatunde', 'Ogunleye', 'Okeke', 'Oladipo', 'Sarpong',
    ],
  },
  {
    key: 'japanese',
    label: 'Japanese',
    given: [
      'Haruki', 'Akiko', 'Daisuke', 'Emiko', 'Fumio', 'Hiroshi', 'Kazuko', 'Kenji', 'Masako', 'Noriko', 'Ryota', 'Sachiko', 'Takeshi',
      'Yoko', 'Yuki', 'Michiko', 'Shigeru', 'Tomoko', 'Keiko', 'Hideo', 'Atsushi', 'Chiyo', 'Isamu', 'Junko', 'Kaoru', 'Makoto', 'Naoko',
      'Osamu', 'Reiko', 'Tadashi',
    ],
    family: [
      'Tanaka', 'Watanabe', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Sato', 'Takahashi', 'Ito', 'Kato', 'Yoshida', 'Yamada', 'Sasaki',
      'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Mori', 'Abe', 'Ishikawa', 'Fujiwara', 'Hasegawa', 'Kondo', 'Murakami',
      'Nishimura', 'Okada', 'Saito', 'Ueda',
    ],
  },
  {
    key: 'filipino',
    label: 'Filipino',
    given: [
      'Maricel', 'Rodrigo', 'Liza', 'Ernesto', 'Corazon', 'Rogelio', 'Jocelyn', 'Arnel', 'Leonora', 'Danilo', 'Rosalinda', 'Efren',
      'Marivic', 'Dante', 'Erlinda', 'Florante', 'Gloria', 'Jun', 'Ligaya', 'Mariano', 'Perla', 'Ronaldo', 'Teresita', 'Wilfredo',
      'Analyn', 'Bayani', 'Dalisay', 'Ramil',
    ],
    family: [
      'Bautista', 'Cruz', 'Dela Cruz', 'Garcia', 'Mendoza', 'Ramos', 'Reyes', 'Santos', 'Aquino', 'Dimaculangan', 'Macaraeg', 'Pangilinan',
      'Villareal', 'Agbayani', 'Buenaventura', 'Dizon', 'Ocampo', 'Pascual', 'Soriano', 'Tolentino', 'Lacson', 'Manalo', 'Dimagiba',
      'Salonga', 'Gatdula',
    ],
  },
  {
    key: 'french',
    label: 'French',
    given: [
      'Adèle', 'Amélie', 'Antoine', 'Aurélien', 'Bastien', 'Bernadette', 'Camille', 'Céline', 'Clément', 'Colette', 'Delphine', 'Étienne',
      'Fabrice', 'Gaston', 'Geneviève', 'Hélène', 'Honoré', 'Isabelle', 'Jacqueline', 'Jules', 'Laurent', 'Léonie', 'Lucien', 'Madeleine',
      'Marcel', 'Margaux', 'Mathilde', 'Noémie', 'Odile', 'Pascal', 'Pierre', 'Raphaël', 'Rémy', 'Sabine', 'Sébastien', 'Simone', 'Sylvie',
      'Thérèse', 'Thibault', 'Valérie', 'Yves', 'Augustin', 'Blanche', 'Eugénie', 'Gilles',
    ],
    family: [
      'Arnaud', 'Beaumont', 'Bertrand', 'Bonnet', 'Chevalier', 'Clément', 'Dubois', 'Dufour', 'Durand', 'Fontaine', 'Fournier', 'Garnier',
      'Girard', 'Gauthier', 'Lambert', 'Laurent', 'Lefèvre', 'Leroy', 'Marchand', 'Mercier', 'Moreau', 'Morel', 'Perrin', 'Renard',
      'Rousseau', 'Roussel', 'Simonet', 'Vasseur', 'Vidal', 'Delacroix', 'Desmarais', 'Lacroix', 'Mallet', 'Tessier', 'Villeneuve',
    ],
  },
  {
    key: 'german',
    label: 'German',
    given: [
      'Adelheid', 'Albrecht', 'Anneliese', 'Bernhard', 'Brigitte', 'Dietrich', 'Elke', 'Erich', 'Friedrich', 'Gerda', 'Gisela', 'Gottfried',
      'Gretchen', 'Günter', 'Hannelore', 'Heinrich', 'Helga', 'Hildegard', 'Ilse', 'Jürgen', 'Karl', 'Klaus', 'Liesel', 'Lothar', 'Margarete',
      'Matthias', 'Monika', 'Otto', 'Reinhard', 'Renate', 'Rudolf', 'Sabine', 'Siegfried', 'Sigrid', 'Ulrich', 'Ursula', 'Volker', 'Walburga',
      'Wolfgang', 'Ingeborg', 'Konrad', 'Dorothea', 'Leopold',
    ],
    family: [
      'Bauer', 'Becker', 'Brandt', 'Braun', 'Engel', 'Fischer', 'Frank', 'Fuchs', 'Graf', 'Hartmann', 'Hoffmann', 'Huber', 'Jäger', 'Keller',
      'Klein', 'Koch', 'König', 'Krause', 'Kühn', 'Lehmann', 'Lorenz', 'Möller', 'Neumann', 'Richter', 'Schäfer', 'Schmitt', 'Schneider',
      'Schröder', 'Schulz', 'Vogel', 'Wagner', 'Weber', 'Winkler', 'Wolff', 'Zimmermann', 'Eichhorn', 'Falkenrath', 'Lindemann',
    ],
  },
  {
    key: 'irish',
    label: 'Irish',
    given: [
      'Aideen', 'Aoife', 'Brendan', 'Bríd', 'Cathal', 'Ciarán', 'Clodagh', 'Colm', 'Cormac', 'Deirdre', 'Declan', 'Dervla', 'Diarmuid',
      'Eamon', 'Éabha', 'Fergal', 'Fionnuala', 'Gráinne', 'Kieran', 'Liam', 'Máire', 'Maeve', 'Niamh', 'Nuala', 'Oisín', 'Orla', 'Pádraig',
      'Róisín', 'Rory', 'Saoirse', 'Seamus', 'Siobhán', 'Sorcha', 'Tadhg', 'Úna', 'Aisling', 'Conor', 'Dónal', 'Eithne', 'Ronan',
    ],
    family: [
      'Brennan', 'Byrne', 'Callaghan', 'Connolly', 'Daly', 'Doherty', 'Donnelly', 'Doyle', 'Fitzgerald', 'Flanagan', 'Gallagher', 'Hegarty',
      'Kavanagh', 'Kennedy', 'Lynch', 'MacCarthy', 'MacMahon', 'McCormack', 'McGrath', 'Moloney', 'Mulcahy', 'Murphy', "O'Brien",
      "O'Connell", "O'Donoghue", "O'Driscoll", "O'Keeffe", "O'Sullivan", 'Quinlan', 'Regan', 'Sheehan', 'Tierney', 'Walsh', 'Whelan',
    ],
  },
  {
    key: 'dutch',
    label: 'Dutch & Flemish',
    given: [
      'Anneke', 'Bram', 'Cornelis', 'Daan', 'Dirk', 'Elske', 'Femke', 'Floris', 'Geertruida', 'Hendrik', 'Ilse', 'Jan', 'Joost', 'Katrien',
      'Lieke', 'Maarten', 'Marijke', 'Niels', 'Pieter', 'Roos', 'Ruud', 'Saskia', 'Sjoerd', 'Tineke', 'Wim', 'Willemijn', 'Aart', 'Baukje',
      'Gerrit', 'Hanneke', 'Jeroen', 'Klaas', 'Lotte', 'Mies', 'Reinier',
    ],
    family: [
      'Bakker', 'Bosch', 'Brouwer', 'Boer', 'Graaf', 'Groot', 'Jong', 'Vries', 'Dekker', 'Hendriks', 'Jansen', 'Kok', 'Kuiper', 'Meijer',
      'Mulder', 'Peeters', 'Smit', 'Smits', 'Dam', 'Berg', 'Linden', 'Dijk', 'Verhoeven', 'Vermeulen', 'Visser', 'Willems', 'Claes',
      'Maes', 'Wouters', 'Janssens', 'Leeuwen', 'Wijk', 'Heuvel', 'Beek', 'Velde', 'Hoek',
    ],
    particles: { list: ['van', 'de', 'van der', 'van den', 'van de'], chance: 0.4 },
  },
  {
    key: 'scandinavian',
    label: 'Scandinavian',
    given: [
      'Agnete', 'Anders', 'Astrid', 'Birgit', 'Bjørn', 'Dagny', 'Einar', 'Elin', 'Erik', 'Freja', 'Gunnar', 'Halvard', 'Hedda', 'Ingrid',
      'Karin', 'Knut', 'Lars', 'Liv', 'Magnus', 'Nils', 'Oskar', 'Ragnhild', 'Signe', 'Sigurd', 'Solveig', 'Sten', 'Sune', 'Thorvald',
      'Tove', 'Ulf', 'Vigdis', 'Åsa', 'Ebba', 'Gudrun', 'Henrik', 'Leif', 'Märta', 'Rune', 'Sölve',
    ],
    family: [
      'Andersson', 'Berg', 'Bergström', 'Dahl', 'Ekström', 'Eriksen', 'Hagen', 'Halvorsen', 'Holm', 'Jensen', 'Johansson', 'Karlsson',
      'Larsen', 'Lindqvist', 'Lund', 'Lundgren', 'Magnusson', 'Nielsen', 'Nilsson', 'Nyberg', 'Olsen', 'Pedersen', 'Rasmussen', 'Sandberg',
      'Sjöberg', 'Solberg', 'Strand', 'Söderberg', 'Vik', 'Wallin', 'Åberg', 'Øster',
    ],
  },
  {
    key: 'polish',
    label: 'Polish',
    given: [
      'Agnieszka', 'Andrzej', 'Bartosz', 'Bogumiła', 'Czesław', 'Danuta', 'Dorota', 'Elżbieta', 'Grażyna', 'Halina', 'Henryk', 'Irena',
      'Jadwiga', 'Janusz', 'Jerzy', 'Kazimierz', 'Krystyna', 'Krzysztof', 'Leszek', 'Małgorzata', 'Marianna', 'Mieczysław', 'Piotr',
      'Stanisława', 'Tadeusz', 'Teodora', 'Wacław', 'Wiesława', 'Witold', 'Zbigniew', 'Zofia', 'Bronisław', 'Ewa', 'Grzegorz', 'Ludwika',
    ],
    family: [
      'Adamczyk', 'Bielecki', 'Chmielewski', 'Dąbrowski', 'Gajewski', 'Górski', 'Grabowski', 'Jankowski', 'Jasiński', 'Kaczmarek',
      'Kamiński', 'Kowalczyk', 'Kozłowski', 'Krawczyk', 'Kwiatkowski', 'Lewandowski', 'Majewski', 'Mazur', 'Michalski', 'Nowicki',
      'Pawlak', 'Piotrowski', 'Rutkowski', 'Sikora', 'Sobczak', 'Szymański', 'Walczak', 'Wieczorek', 'Wróblewski', 'Zieliński',
    ],
  },
  {
    key: 'hungarian',
    label: 'Hungarian',
    given: [
      'Ágnes', 'András', 'Attila', 'Balázs', 'Csilla', 'Dénes', 'Dóra', 'Erzsébet', 'Ferenc', 'Gábor', 'Gyöngyi', 'Imre', 'Ildikó', 'István',
      'Judit', 'Katalin', 'Lajos', 'László', 'Magdolna', 'Márta', 'Miklós', 'Orsolya', 'Pál', 'Piroska', 'Sándor', 'Szilvia', 'Tibor',
      'Vilma', 'Zoltán', 'Zsófia', 'Zsuzsanna', 'Endre', 'Gizella', 'Kálmán', 'Réka',
    ],
    family: [
      'Balogh', 'Bárány', 'Bíró', 'Csonka', 'Farkas', 'Fehér', 'Fekete', 'Fodor', 'Hajdú', 'Halász', 'Horváth', 'Juhász', 'Kelemen',
      'Kovács', 'Lakatos', 'Lukács', 'Mészáros', 'Molnár', 'Nagy', 'Németh', 'Oláh', 'Pap', 'Rácz', 'Szabó', 'Szalai', 'Szűcs', 'Takács',
      'Tóth', 'Vass', 'Vörös',
    ],
  },
  {
    key: 'greek',
    label: 'Greek',
    given: [
      'Aikaterini', 'Alexandros', 'Anastasia', 'Andreas', 'Athena', 'Christos', 'Daphne', 'Demetrios', 'Eleni', 'Evangelos', 'Georgios',
      'Ioanna', 'Kalliope', 'Konstantinos', 'Kyriakos', 'Lefteris', 'Maria', 'Nikolaos', 'Panagiotis', 'Penelope', 'Sofia', 'Spyros',
      'Stavros', 'Theodora', 'Vasiliki', 'Yannis', 'Zoe', 'Antigone', 'Charalambos', 'Despina', 'Irini', 'Michalis', 'Xanthe',
    ],
    family: [
      'Alexiou', 'Angelopoulos', 'Antoniou', 'Christodoulou', 'Dimitriou', 'Georgiou', 'Ioannidis', 'Karagiannis', 'Konstantinidis',
      'Lambrou', 'Makris', 'Nikolaidis', 'Oikonomou', 'Papadakis', 'Papadopoulos', 'Pappas', 'Petrakis', 'Stavropoulos', 'Theodorou',
      'Vlachos', 'Zervas', 'Kyriakou', 'Mavros', 'Raptis', 'Samaras', 'Triantafyllou', 'Vasileiou', 'Xenakis',
    ],
  },
];
