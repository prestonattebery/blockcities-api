const _ = require('lodash');

const blockcitiesContractService = require('../services/blockcities.contract.service');
const specialMapping = require('./special-data-mapping');
const {decorateMetadataName} = require("./metadata.decorator");

module.exports = {

    async tokenPointers(request, response) {
        const network = request.params.network;
        const tokenPointers = await blockcitiesContractService.tokenPointers(network);
        console.log(tokenPointers);
        return response.status(200).json(tokenPointers);
    },

    async _metadata(network, tokenId) {

        const tokenBaseURI = await blockcitiesContractService.tokenBaseURI(network);
        const tokenAttrs = await blockcitiesContractService.tokenDetails(network, tokenId);

        if (tokenAttrs.special !== 0) {
            return {
                name: `${specialMapping[tokenAttrs.special].name}`,
                description: `${specialMapping[tokenAttrs.special].city}`,
                image: `${tokenBaseURI[0]}${tokenId}/image`,
                attributes: {
                    ...decorateMetadataName(tokenAttrs)
                }
            };
        }

        return {
            name: `building ${tokenId}`,
            description: `building ${tokenId}`,
            image: `${tokenBaseURI[0]}${tokenId}/image`,
            attributes: {
                ...decorateMetadataName(tokenAttrs)
            }
        };
    },

    async tokenMetadata(request, response) {

        const tokenId = request.params.tokenId;
        const network = request.params.network;

        const metadata = await this._metadata(network, tokenId);

        return response.status(200).json(metadata);
    },

    async lookupTokenDetails(request, response) {

        const tokenId = request.params.tokenId;
        const network = request.params.network;

        const tokenDetails = await blockcitiesContractService.tokenDetails(network, tokenId);
        const metaData = await this._metadata(network, tokenId);

        return response.status(200).json({...tokenDetails, tokenId});
    },

    async lookupTokenDetailsForOwner(request, response) {

        const owner = request.params.owner;
        const network = request.params.network;

        const tokens = await blockcitiesContractService.tokensOfOwner(network, owner);

        const mappedTokens = await Promise.all(_.map(tokens[0], async (t) => {
            const tokenDetails = await blockcitiesContractService.tokenDetails(network, t);
            const metaData = await this._metadata(network, t);

            return {...tokenDetails, ...metaData, tokenId: t};
        }));

        return response.status(200).json(mappedTokens);
    }
};
