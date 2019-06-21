const probe = require('probe-image-size');

const blockcitiesContractService = require('./blockcities.contract.service');
const webflowDataService = require('./webflow/webflowDataService');
const imageBuilderService = require('./imageBuilder.service');

const {backgroundColorwaySwitch} = require('./metadata/background-colours');
const {decorateMetadataName} = require('./metadata/metadata.decorator');
const specialMapping = require('./metadata/special-data-mapping');
const {shortCityNameMapper} = require('./metadata/citymapper');
const {heightMapper, heightInFootDescription} = require('./metadata/height-mapper');

const config = require('./webflow/config');

const padTokenId = (tokenId) => ('00000' + tokenId).slice(-6);

const dot = (ethAccount) => ethAccount.substr(0, 4) + '...' + ethAccount.substr(ethAccount.length - 4, ethAccount.length);

class BlockCitiesDataService {

    async tokenPointers(network) {
        return blockcitiesContractService.tokenPointers(network);
    }

    async tokenDetails(network, tokenId) {
        return blockcitiesContractService.tokenDetails(network, tokenId);
    }

    async tokenDetails(network, tokenId) {
        return blockcitiesContractService.tokenDetails(network, tokenId);
    }

    async ownerOfToken(network, tokenId) {
        return blockcitiesContractService.ownerOfToken(network, tokenId);
    }

    async tokensOfOwner(network, owner) {
        return blockcitiesContractService.tokensOfOwner(network, owner);
    }

    async birthEventForToken(network, tokenId) {
        return blockcitiesContractService.birthEventForToken(network, tokenId);
    }

    async tokenMetadata(network, tokenId) {

        const tokenBaseURI = await blockcitiesContractService.tokenBaseURI(network);
        const tokenAttrs = await blockcitiesContractService.tokenDetails(network, tokenId);

        const attrs = decorateMetadataName(tokenAttrs);

        if (tokenAttrs.special !== 0) {
            return {
                name: `${specialMapping[tokenAttrs.special].name}`,
                description: `#${padTokenId(tokenId)}`,
                image: `${tokenBaseURI[0]}${tokenId}/image`,
                background_color: backgroundColorwaySwitch(tokenAttrs.backgroundColorway, tokenAttrs.special).hex,
                attributes: {
                    ...attrs
                }
            };
        }

        return {
            name: `Building #${padTokenId(tokenId)}`,
            description: `#${padTokenId(tokenId)}`,
            image: `${tokenBaseURI[0]}${tokenId}/image`,
            background_color: backgroundColorwaySwitch(tokenAttrs.backgroundColorway).hex,
            attributes: {
                ...attrs
            }
        };
    }

    async exportWebflowBuildProfile(network, tokenId) {
        const buildingConstructionData = await this.birthEventForToken(network, tokenId);
        const tokenDetails = await this.tokenDetails(network, tokenId);
        const metaData = await this.tokenMetadata(network, tokenId);
        const owner = await this.ownerOfToken(network, tokenId);

        // join all info into a data object
        const data = {
            ...tokenDetails,
            ...metaData,
            ...buildingConstructionData,
            tokenId,
            owner
        };

        const dimensions = await probe(data.image);

        // Standard width
        const {/*adjustedBodyHeight: standardBodyHeight, */adjustedBodyWidth: standardBodyWidth/*, canvasHeight: standardCanvasHeight*/} = await imageBuilderService.generateImageStats({
            building: data.building,
            base: 0,
            body: 0,
            roof: 0,
            exteriorColorway: data.exteriorColorway,
            backgroundColorway: data.backgroundColorway,
        });

        // Adjusted width
        const {/*adjustedBodyHeight, */adjustedBodyWidth/*, canvasHeight*/} = await imageBuilderService.generateImageStats({
            building: data.building,
            base: data.base,
            body: data.body,
            roof: data.roof,
            exteriorColorway: data.exteriorColorway,
            backgroundColorway: data.backgroundColorway,
        });

        // console.log(`S height ${standardBodyHeight} body ${standardBodyWidth} height ${standardCanvasHeight}`);
        // console.log(`A height ${adjustedBodyHeight} body ${adjustedBodyWidth} height ${canvasHeight}`);

        const heightInFt = heightMapper({
            standardWidth: standardBodyWidth,
            adjustedWidth: adjustedBodyWidth,
            pixelHeight: dimensions.height,
            buildingId: data.building
        });

        console.log(`token ID ${data.tokenId}, building ID ${data.building}, Standard width ${standardBodyWidth}, Adjusted width ${adjustedBodyWidth}, Pixel height ${dimensions.height}, Height ${heightInFt} (${heightInFootDescription(heightInFt)})`);

        const res = await webflowDataService.addItemToCollection(config.collections.buildings, {
            'token-id': data.attributes.tokenId,
            'building-image-primary': `https://us-central1-block-cities.cloudfunctions.net/api/network/1/token/image/${data.attributes.tokenId}.png`,
            'building-image-link': `https://us-central1-block-cities.cloudfunctions.net/api/network/1/token/image/${data.attributes.tokenId}.png`,
            'background-color': `#${data.background_color}`,
            'city': shortCityNameMapper(data.city),
            'city-full-name': data.attributes.city,
            'era': '0',
            'era-class': 'Modern',
            'architect': data.attributes.architect,
            'original-architect-short': dot(data.attributes.architect),
            'current-owner': data.owner,
            'current-owner-short': dot(data.owner),
            'buildingdescription': data.description,
            'height': heightInFt,
            'height-class': heightInFootDescription(heightInFt),
            'date-built': data.blockTimestampPretty,
            'groundfloor': data.attributes.groundFloor,
            'body': data.attributes.body,
            'roof': data.attributes.roof,
            'ground-floor-exterior-color': data.attributes.exteriorColorway,
            'ground-floor-window-color': data.attributes.baseWindowColorway,
            'ground-floor-window-type': data.attributes.windowType,
            'ground-floor-use': '',
            'body-exterior-color': data.attributes.exteriorColorway,
            'body-window-color': data.attributes.bodyWindowColorway,
            'body-window-type': data.attributes.windowType,
            'body-use': '',
            'roof-exterior-color': data.attributes.exteriorColorway,
            'roof-window-color': data.attributes.roofWindowColorway,
            'roof-window-type': data.attributes.windowType,
            'roof-use': '',
            'name': data.name,
            'slug': data.attributes.tokenId.toString(), // slug is used to define URL
        });

        console.log(`Added token [${tokenId}] to webflow - status [${res.status}]`);
        return res;
    }
}

module.exports = new BlockCitiesDataService();
