const { Pokemon, Type } = require("../../../db");
const controllerGetTypesFromApi = require("../../getControllers/getControllersType/controllerGetTypesFromApi");

/**
 * Crea un nuevo Pokémon en la base de datos.
 * @param {string} name - El nombre del Pokémon.
 * @param {number} hp - La vida del Pokémon.
 * @param {number} attack - El ataque del Pokémon.
 * @param {number} defense - La defensa del Pokémon.
 * @param {number} speed - La velocidad del Pokémon.
 * @param {number} height - La altura del Pokémon.
 * @param {number} weight - El peso del Pokémon.
 * @param {Array<string>} types - Un array de strings que representan los tipos del Pokémon.
 * @param {string} image - La imagen del Pokémon.
 * @returns {Promise<Object>} El Pokémon creado con sus tipos relacionados o un objeto de error.
 * @throws {Error} Lanza un error si los tipos proporcionados no existen, si el Pokémon ya existe o si la creación falla.
 */
const controllerPostPokemon = async (
  name,
  hp,
  attack,
  defense,
  speed,
  height,
  weight,
  types,
  image
) => {
  try {
    // Formatea el nombre del Pokémon
    const formattedName = name?.toLowerCase().trim();
    // Verifica si el Pokémon ya existe en la base de datos
    const exists = await Pokemon.findOne({ where: { name: formattedName } });

    if (exists) {
      throw new Error(`El Pokémon ${name} ya existe en la base de datos`);
    }

    // Obtener los tipos válidos desde la API y la base de datos
    const validTypesFromApi = await controllerGetTypesFromApi();
    const validTypesFromDb = await Type.findAll({ attributes: ["name"] });
    const validTypes = [
      ...validTypesFromApi,
      ...validTypesFromDb.map((type) => type.name.toLowerCase()),
    ];

    // Verificar si alguno de los tipos proporcionados no es válido
    const invalidTypes = types
      .map((type) => type.toLowerCase()) // Normaliza los tipos proporcionados
      .filter((type) => !validTypes.includes(type));

    if (invalidTypes.length > 0) {
      throw new Error(
        `Uno o más tipos proporcionados no existen: ${invalidTypes.join(", ")}`
      );
    }

    // Crear el nuevo Pokémon
    const newPokemon = await Pokemon.create({
      name: formattedName,
      hp,
      attack,
      defense,
      speed,
      height,
      weight,
      image,
    });

    // Asignar los tipos al nuevo Pokémon
    const pokemonTypes = await Type.findAll({ where: { name: types.map(type => type.toLowerCase()) } });
    await newPokemon.addTypes(pokemonTypes);

    // Devolver el Pokémon creado con sus tipos
    const pokemonWithTypes = await Pokemon.findByPk(newPokemon.id, {
      include: {
        model: Type,
        attributes: ["name"],
        through: { attributes: [] },
      },
    });

    return pokemonWithTypes;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = controllerPostPokemon;
