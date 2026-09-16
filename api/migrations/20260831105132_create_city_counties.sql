-- Migration: create_city_counties
-- Created: 2026-08-31 10:51:32

CREATE TABLE counties (
  name TEXT PRIMARY KEY
);

CREATE TABLE city_counties (
  city   TEXT PRIMARY KEY,
  county TEXT NOT NULL REFERENCES counties(name)
);

CREATE UNIQUE INDEX city_counties_lower_city_idx ON city_counties (lower(city));

INSERT INTO counties (name) VALUES
  ('Atlantic'),('Bergen'),('Burlington'),('Camden'),('Cape May'),('Cumberland'),
  ('Essex'),('Gloucester'),('Hudson'),('Hunterdon'),('Mercer'),('Middlesex'),
  ('Monmouth'),('Morris'),('Ocean'),('Passaic'),('Salem'),('Somerset'),('Sussex'),
  ('Union'),('Warren');

INSERT INTO city_counties (city, county) VALUES
  -- Atlantic (12)
  ('Absecon','Atlantic'),('Atlantic City','Atlantic'),('Egg Harbor City','Atlantic'),
  ('Egg Harbor Township','Atlantic'),('Galloway','Atlantic'),('Hammonton','Atlantic'),
  ('Mays Landing','Atlantic'),('Minotola','Atlantic'),('Northfield','Atlantic'),
  ('Pleasantville','Atlantic'),('Somers Point','Atlantic'),('Ventnor City','Atlantic'),
  -- Bergen (38)
  ('Bergenfield','Bergen'),('Closter','Bergen'),('Creskill borough','Bergen'),
  ('Dumont','Bergen'),('East Rutherford','Bergen'),('Edgewater','Bergen'),
  ('Elmwood Park','Bergen'),('Emerson','Bergen'),('Englewood','Bergen'),
  ('Fair Lawn','Bergen'),('Fort Lee','Bergen'),('Franklin Lakes','Bergen'),
  ('Garfield','Bergen'),('Hackensack','Bergen'),('Hillsdale','Bergen'),
  ('Little Ferry','Bergen'),('Lodi','Bergen'),('Lyndhurst','Bergen'),('Mahwah','Bergen'),
  ('Maywood','Bergen'),('Midland Park','Bergen'),('Montvale','Bergen'),
  ('New Milford','Bergen'),('Oakland','Bergen'),('Old Tappan','Bergen'),('Paramus','Bergen'),
  ('Ramsey','Bergen'),('Ridgefield Park','Bergen'),('River Edge','Bergen'),
  ('Rivervale','Bergen'),('Rutherford','Bergen'),('Saddle Brook','Bergen'),
  ('Saddle River','Bergen'),('Teaneck','Bergen'),('Township of Washington','Bergen'),
  ('Westwood','Bergen'),('Wood Ridge','Bergen'),('Wyckoff','Bergen'),
  -- Burlington (25)
  ('Beverly','Burlington'),('Bordentown','Burlington'),('Browns Mills','Burlington'),
  ('Burlington','Burlington'),('Chesterfield','Burlington'),('Cinnaminson','Burlington'),
  ('Delanco','Burlington'),('Delran','Burlington'),('Eastampton','Burlington'),
  ('Edgewater Park','Burlington'),('Evesham','Burlington'),('Florence','Burlington'),
  ('Hainesport','Burlington'),('Lumberton','Burlington'),('Maple Shade','Burlington'),
  ('Marlton','Burlington'),('Medford','Burlington'),('Moorestown','Burlington'),
  ('Mount Holly','Burlington'),('Mount Laurel','Burlington'),('Palmyra','Burlington'),
  ('Roebling','Burlington'),('Westampton','Burlington'),('Willingboro','Burlington'),
  ('Wrightstown','Burlington'),
  -- Camden (26)
  ('Atco','Camden'),('Audubon','Camden'),('Barrington','Camden'),('Bellmawr','Camden'),
  ('Berlin','Camden'),('Blackwood','Camden'),('Camden','Camden'),('Cherry Hill','Camden'),
  ('Chesilhurst','Camden'),('Clementon','Camden'),('Collingswood','Camden'),
  ('Gibbsboro','Camden'),('Glendora','Camden'),('Gloucester City','Camden'),
  ('Haddon Heights','Camden'),('Haddonfield','Camden'),('Lawnside','Camden'),
  ('Lindenwold','Camden'),('Merchantville','Camden'),('Oaklyn','Camden'),
  ('Pennsauken','Camden'),('Pine Hill','Camden'),('Sicklerville','Camden'),
  ('Somerdale','Camden'),('Voorhees','Camden'),('West Berlin','Camden'),
  -- Cape May (4)
  ('Cape May','Cape May'),('Marmora','Cape May'),('Ocean City','Cape May'),
  ('Rio Grande','Cape May'),
  -- Cumberland (3)
  ('Bridgeton','Cumberland'),('Millville','Cumberland'),('Vineland','Cumberland'),
  -- Essex (17)
  ('Belleville','Essex'),('Bloomfield','Essex'),('Caldwell','Essex'),('East Orange','Essex'),
  ('Irvington','Essex'),('Livingston','Essex'),('Maplewood','Essex'),('Millburn','Essex'),
  ('Montclair','Essex'),('Newark','Essex'),('Nutley','Essex'),('Orange','Essex'),
  ('Roseland','Essex'),('South Orange','Essex'),('Verona','Essex'),('West Caldwell','Essex'),
  ('West Orange','Essex'),
  -- Gloucester (19)
  ('Clarksboro','Gloucester'),('Clayton','Gloucester'),('Deptford','Gloucester'),
  ('Glassboro','Gloucester'),('Mantua','Gloucester'),('Mount Royal','Gloucester'),
  ('Mullica Hill','Gloucester'),('Paulsboro','Gloucester'),('Sewell','Gloucester'),
  ('Swedesboro','Gloucester'),('Thorofare','Gloucester'),('Turnersville','Gloucester'),
  ('Wenonah','Gloucester'),('West Deptford','Gloucester'),('Westville','Gloucester'),
  ('Williamstown','Gloucester'),('Woodbury','Gloucester'),('Woodbury Heights','Gloucester'),
  ('Woolwich Township','Gloucester'),
  -- Hudson (9)
  ('Bayonne','Hudson'),('Harrison','Hudson'),('Hoboken','Hudson'),('Jersey City','Hudson'),
  ('Kearny','Hudson'),('North Bergen','Hudson'),('Union City','Hudson'),
  ('Weehawken','Hudson'),('West New York','Hudson'),
  -- Hunterdon (11)
  ('Annandale','Hunterdon'),('Clinton','Hunterdon'),('Delaware Township','Hunterdon'),
  ('Flemington','Hunterdon'),('Frenchtown','Hunterdon'),('Hampton','Hunterdon'),
  ('High Bridge','Hunterdon'),('Lambertville','Hunterdon'),('Lebanon','Hunterdon'),
  ('Tewksbury','Hunterdon'),('Whitehouse Station','Hunterdon'),
  -- Mercer (14)
  ('East Windsor','Mercer'),('Ewing','Mercer'),('Hamilton','Mercer'),('Hightstown','Mercer'),
  ('Hopewell','Mercer'),('Hopewell Township','Mercer'),('Lawrence','Mercer'),
  ('Lawrenceville','Mercer'),('Pennington','Mercer'),('Princeton','Mercer'),
  ('Princeton Junction','Mercer'),('Robbinsville','Mercer'),('Trenton','Mercer'),
  ('West Windsor','Mercer'),
  -- Middlesex (28)
  ('Avenel','Middlesex'),('Carteret','Middlesex'),('Colonia','Middlesex'),
  ('Cranbury','Middlesex'),('Dunellen','Middlesex'),('East Brunswick','Middlesex'),
  ('Edison','Middlesex'),('Fords','Middlesex'),('Highland Park','Middlesex'),
  ('Hopelawn','Middlesex'),('Keasby','Middlesex'),('Metuchen','Middlesex'),
  ('Middlesex','Middlesex'),('Monmouth Junction','Middlesex'),
  ('Monroe Township','Middlesex'),('New Brunswick','Middlesex'),
  ('North Brunswick','Middlesex'),('Old Bridge','Middlesex'),('Parlin','Middlesex'),
  ('Perth Amboy','Middlesex'),('Piscataway','Middlesex'),('Plainsboro','Middlesex'),
  ('Sayreville','Middlesex'),('South Amboy','Middlesex'),('South Brunswick','Middlesex'),
  ('South Plainfield','Middlesex'),('Spotswood','Middlesex'),('Woodbridge','Middlesex'),
  -- Monmouth (35)
  ('Aberdeen','Monmouth'),('Asbury Park','Monmouth'),('Atlantic Highlands','Monmouth'),
  ('Belmar','Monmouth'),('Bradley Beach','Monmouth'),('Cliffwood','Monmouth'),
  ('Colts Neck','Monmouth'),('Eatontown','Monmouth'),('Farmingdale','Monmouth'),
  ('Fort Monmouth','Monmouth'),('Freehold','Monmouth'),('Hazlet','Monmouth'),
  ('Holmdel','Monmouth'),('Howell','Monmouth'),('Keansburg','Monmouth'),
  ('Keyport','Monmouth'),('Lincroft','Monmouth'),('Long Branch','Monmouth'),
  ('Manalapan','Monmouth'),('Manasquan','Monmouth'),('Marlboro','Monmouth'),
  ('Matawan','Monmouth'),('Middletown','Monmouth'),('Morganville','Monmouth'),
  ('Neptune','Monmouth'),('Ocean','Monmouth'),('Oceanport','Monmouth'),
  ('Red Bank','Monmouth'),('Rumson','Monmouth'),('Sea Girt','Monmouth'),
  ('Spring Lake','Monmouth'),('Tinton Falls','Monmouth'),('Wall','Monmouth'),
  ('Wall Township','Monmouth'),('West Long Branch','Monmouth'),
  -- Morris (31)
  ('Boonton','Morris'),('Buddlake','Morris'),('Butler','Morris'),('Cedar Knolls','Morris'),
  ('Chatham','Morris'),('Chester','Morris'),('Denville','Morris'),('Dover','Morris'),
  ('East Hanover','Morris'),('Flanders','Morris'),('Florham Park','Morris'),
  ('Kinnelon','Morris'),('Landing','Morris'),('Ledgewood','Morris'),('Long Valley','Morris'),
  ('Madison','Morris'),('Mendham','Morris'),('Mine Hill','Morris'),('Montville','Morris'),
  ('Morris Plains','Morris'),('Morristown','Morris'),('Mount Arlington','Morris'),
  ('Netcong','Morris'),('Parsippany','Morris'),('Pine Brook','Morris'),('Randolph','Morris'),
  ('Rockaway','Morris'),('Stirling','Morris'),('Succasunna','Morris'),('Wharton','Morris'),
  ('Whippany','Morris'),
  -- Ocean (18)
  ('Barnegat','Ocean'),('Bayville','Ocean'),('Brick','Ocean'),('Forked River','Ocean'),
  ('Jackson','Ocean'),('Lakewood','Ocean'),('Little Egg Harbor','Ocean'),
  ('Manahawkin','Ocean'),('Manchester','Ocean'),('Point Pleasant Beach','Ocean'),
  ('Point Pleasant Borough','Ocean'),('Seaside Heights','Ocean'),
  ('Stafford Township','Ocean'),('Toms River','Ocean'),('Tuckerton','Ocean'),
  ('Waretown','Ocean'),('West Creek','Ocean'),('Whiting','Ocean'),
  -- Passaic (11)
  ('Bloomingdale','Passaic'),('Clifton','Passaic'),('Haskell','Passaic'),
  ('Little Falls','Passaic'),('Passaic','Passaic'),('Paterson','Passaic'),
  ('Prospect Park','Passaic'),('Totawa','Passaic'),('Wayne','Passaic'),
  ('West Milford','Passaic'),('Woodland Park','Passaic'),
  -- Salem (6)
  ('Carneys Point','Salem'),('Pedricktown','Salem'),('Penns Grove','Salem'),
  ('Pennsville','Salem'),('Salem','Salem'),('Woodstown','Salem'),
  -- Somerset (18)
  ('Basking Ridge','Somerset'),('Bedminster','Somerset'),('Belle Mead','Somerset'),
  ('Branchburg','Somerset'),('Bridgewater','Somerset'),('Far Hills','Somerset'),
  ('Franklin Park','Somerset'),('Hillsborough','Somerset'),('Millstone','Somerset'),
  ('North Plainfield','Somerset'),('Peapack','Somerset'),('Raritan','Somerset'),
  ('Skillman','Somerset'),('Somerset','Somerset'),('Somerville','Somerset'),
  ('South Bound Brook','Somerset'),('Warren','Somerset'),('Watchung','Somerset'),
  -- Sussex (6)
  ('Andover','Sussex'),('Franklin','Sussex'),('Hardyston','Sussex'),('Newton','Sussex'),
  ('Sparta','Sussex'),('Vernon','Sussex'),
  -- Union (16)
  ('Berkeley Heights','Union'),('Clark','Union'),('Cranford','Union'),('Elizabeth','Union'),
  ('Garwood','Union'),('Linden','Union'),('New Providence','Union'),('Plainfield','Union'),
  ('Rahway','Union'),('Roselle','Union'),('Roselle Park','Union'),('Scotch Plains','Union'),
  ('Springfield','Union'),('Summit','Union'),('Union','Union'),('Westfield','Union'),
  -- Warren (6)
  ('Allamuchy','Warren'),('Belvidere','Warren'),('Hackettstown','Warren'),
  ('Lopatcong Township','Warren'),('Phillipsburg','Warren'),('Stewartsville','Warren');
