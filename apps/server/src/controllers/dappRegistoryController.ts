import { Request, Response } from "express";
import { DAppSchema, FilterOptions } from "@merokudao/dapp-store-registry";
import { DappStoreRegistry } from "@merokudao/dapp-store-registry";
import { validationResult } from "express-validator";
import Debug from "debug";
import parseISO from "date-fns/parseISO";

const debug = Debug("meroku:server");
var utils = require("../utils/writer.js");
const DappStore = new DappStoreRegistry();

class DappRegistory {
  constructor() {
    this.getDapps = this.getDapps.bind(this);
    this.addDapp = this.addDapp.bind(this);
    this.updateDapp = this.updateDapp.bind(this);
    this.deleteDapp = this.deleteDapp.bind(this);
  }

  getDapps = async (req: Request, res: Response) => {
    await DappStore.init();
    var search: string = <string>req.query.search;
    var filterOpts: FilterOptions = { isListed: true };

    try {
      if (req.query.isMatureContent) {
        filterOpts.forMatureAudience =
          req.query.isMatureContent === "true" ? true : false;
      }

      if (req.query.minAge) {
        try {
          var age: number;
          let minAge = <string>req.query.minAge;
          age = parseInt(minAge);
          if (Number(age)) filterOpts.minAge = age;
        } catch (e) {
          debug(e.message);
        }
      }

      console.log(filterOpts.minAge);

      if (req.query.chainId) {
        try {
          var chainId = parseInt(<string>req.query.chainId);
          if (Number(chainId)) filterOpts.chainId = chainId;
        } catch (e) {
          debug(e.message);
        }
      }

      if (req.query.language) {
        filterOpts.language = <string>req.params.language;
      }

      if (req.query.availableOnPlatform) {
        let tmp = <string>req.query.availableOnPlatform;
        let arr: string[] = tmp.split(",").map((item: string) => item.trim());
        filterOpts.availableOnPlatform = arr;
      }

      if (req.query.listedOnOrAfter) {
        try {
          filterOpts.listedOnOrAfter = parseISO(
            <string>req.query.listedOnOrAfter
          );
        } catch (e) {
          debug(e.message);
        }
      }

      if (req.query.listedOnOrBefore) {
        try {
          filterOpts.listedOnOrBefore = parseISO(<string>req.query.minAge);
        } catch (e) {
          debug(e.message);
        }
      }

      if (req.query.allowedInCountries) {
        let tmp = <string>req.query.allowedInCountries;
        let arr: string[] = tmp.split(",").map((item: string) => item.trim());
        filterOpts.allowedInCountries = arr;
      }

      if (req.query.blockedInCountries) {
        let tmp = <string>req.query.blockedInCountries;
        let arr: string[] = tmp.split(",").map((item: string) => item.trim());
        filterOpts.blockedInCountries = arr;
      }

      if (req.query.categories) {
        let tmp = <string>req.query.categories;
        let arr: string[] = tmp.split(",").map((item: string) => item.trim());
        filterOpts.categories = arr;
      }

      if (req.query.isListed) {
        filterOpts.isListed = req.query.isListed === "true" ? true : false;
      }

      if (req.query.developer) {
        let tmp = <string>req.query.developer;
        tmp = tmp.trim();
        filterOpts.developer.githubID = tmp;
      }

      if (search && search.trim() !== "") {
        const response: DAppSchema[] = DappStore.search(search, filterOpts);
        utils.writeJson(res, response);
      } else {
        const response: DAppSchema[] = await DappStore.dApps(filterOpts);
        utils.writeJson(res, response);
      }
    } catch (e) {
      utils.writeJson(res, e, 400);
    }
  };

  addDapp = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // no errors
      const name: string = req.body.name;
      const email: string = req.body.email;
      const accessToken: string = req.body.accessToken;
      const githubID: string = req.body.githubID;
      const dapp: DAppSchema = req.body.dapp;
      const org: string = req.body.org;

      try {
        const response = DappStore.addOrUpdateDapp(
          name,
          email,
          accessToken,
          githubID,
          dapp,
          org
        );
        utils.writeJson(res, response);
      } catch (e) {
        utils.writeJson(res, e, 400);
      }
    } else {
      // errors
      debug(`Validation errors: ${result}`);
      utils.writeJson(res, "Validation errors", 400);
    }
  };

  updateDapp = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // no errors
      const name: string = req.body.name;
      const email: string = req.body.email;
      const accessToken: string = req.body.accessToken;
      const githubID: string = req.body.githubID;
      const dapp: DAppSchema = req.body.dapp;
      const org: string = req.body.org;

      try {
        const response = DappStore.addOrUpdateDapp(
          name,
          email,
          accessToken,
          githubID,
          dapp,
          org
        );
        utils.writeJson(res, response);
      } catch (e) {
        utils.writeJson(res, e, 400);
      }
    } else {
      // errors
      debug(`Validation errors: ${result}`);
      utils.writeJson(res, "Validation errors", 400);
    }
  };

  deleteDapp = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // no errors
      const name: string = <string>req.body.name;
      const email: string = <string>req.body.email;
      const accessToken: string = <string>req.body.accessToken;
      const githubID: string = <string>req.body.githubID;
      const dappId: string = <string>req.body.dappId;
      const org: string = <string>req.body.org;

      try {
        await DappStore.init();
        const response = DappStore.deleteDapp(
          name,
          email,
          accessToken,
          githubID,
          dappId,
          org
        );
        utils.writeJson(res, response);
      } catch (e) {
        utils.writeJson(res, e, 400);
      }
    } else {
      // errors
      debug(`Validation errors: ${result}`);
      utils.writeJson(res, "Validation errors", 400);
    }
  };
}

export default new DappRegistory();
