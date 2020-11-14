import MetaTagsJson from "../assets/metatags.json";

export const getMetaTag = path => {
    const tag = MetaTagsJson.find(tag => tag.path.indexOf(path) > -1);
    return tag;
};
