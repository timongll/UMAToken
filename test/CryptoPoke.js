const CryptoPoke = artifacts.require("CryptoPoke");
const { BN, time } = require('@openzeppelin/test-helpers');
const pokemonNames = ["Pokemon 1", "Aabaeh125"];
contract("CryptoPoke", (accounts) => {
    let [alice, bob] = accounts;
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await CryptoPoke.new();
    });
    it("should be able to create a new pokemon", async () => {
        const result = await contractInstance.createRandomPokemon(pokemonNames[0], {from: alice});
        assert.equal(result.receipt.status, true);
        assert.equal(result.logs[0].args.nickname,pokemonNames[0]);
    })

    it("should evolve pokemon", async () => {
        const result = await contractInstance.createRandomPokemon(pokemonNames[0], {from: alice});
        const pokedexNum = result.logs[0].args.pokedexNum.toNumber();
        const pokemonId = result.logs[0].args.id.toNumber();
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        await contractInstance.levelUp(pokemonId, {from: alice});
        const result1 = await contractInstance.levelUp(pokemonId, {from: alice});
        const pokemonName = result1.logs[0].args.name.toString();
        const pokedexNum1 = result1.logs[0].args.pokedexNum.toNumber();
        assert.equal(pokedexNum +6, pokedexNum1)
        assert.equal(pokemonName, "ivysaur"); 
    })
    context("with the single-step transfer scenario", async () => {
        it("should transfer a pokemon", async () => {
            const result = await contractInstance.createRandomPokemon(pokemonNames[0], {from: alice});
            const pokemonId = result.logs[0].args.id.toNumber();
            await contractInstance._transfer(alice, bob, pokemonId, {from: alice});
            const newOwner = await contractInstance.ownerOf(pokemonId);
            assert.equal(newOwner, bob); 
        })
    })
    
    it("damage a pokemon", async () => {
        const result = await contractInstance.createRandomPokemon(pokemonNames[1], {from: alice});
        const result1 = await contractInstance.createRandomPokemon(pokemonNames[0], {from: bob});
        const pokemonId = result.logs[0].args.id.toNumber();
        const enemyPokemonId = result1.logs[0].args.id.toNumber();
        const attacked = await contractInstance.attack(pokemonId, enemyPokemonId, {from: alice});
        await time.increase(100000000);
        await contractInstance.attack(pokemonId, enemyPokemonId, {from: alice});
        const health = attacked.logs[0].args.health.toNumber();
        assert.equal(health, 100); 
    })
    xcontext("with the two-step transfer scenario", async () => {
        it("should approve and then transfer a pokemon when the approved address calls transferForm", async () => {
            const result = await contractInstance.createRandomPokemon(pokemonNames[0], {from: alice});
            const pokemonId = result.logs[0].args.id.toNumber();
            await contractInstance.approve(bob, pokemonId, {from: alice});
            await contractInstance.transferFrom(alice, bob, pokemonId, {from: bob});
            const newOwner = await contractInstance.ownerOf(pokemonId);
            assert.equal(newOwner,bob);
        })
        it("should approve and then transfer a zombie when the owner calls transferForm", async () => {
            const result = await contractInstance.createRandomPokemon(pokemonNames[0], {from: alice});
            const pokemonId = result.logs[0].args.id.toNumber();
            await contractInstance.approve(bob, pokemonId, {from: alice});
            await contractInstance.transferFrom(alice, bob, pokemonId, {from: alice});
            const newOwner = await contractInstance.ownerOf(pokemonId);
            assert.equal(newOwner,bob);   
         })
    })

})
