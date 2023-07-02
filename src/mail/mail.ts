"use strict";
import f from "cross-fetch";


module.exports.SolunApiClient = class {
  baseurl: any;
  apikey: any;
  constructor(baseurl: any, apikey: any) {
    this.baseurl = baseurl;
    this.apikey = apikey;
  }

  async addMailbox(mailbox: any) {
    if (!mailbox) throw new Error("Mailbox must be provided as Mailbox Object");
    if (!mailbox.domain)
      throw new Error(
        'Mailbox object must at least contain a domain name. Example: {domain:"example.com"}'
      );
    if (!mailbox.domain.match(/[A-Z-a-z0-9]+\.[A-Z-a-z0-9]+$/))
      throw new Error("domain name is invalid");

    mailbox.active = mailbox.active;
    mailbox.password = mailbox.password;
    mailbox.password2 = mailbox.password;
    mailbox.quota = mailbox.quota;
    mailbox.name = mailbox.name;
    mailbox.local_part = mailbox.local_part;

    return f(`${this.baseurl}/api/v1/add/mailbox`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailbox),
    }).then(async (res: { json: () => Promise<any> }) => {
      const j = await res.json().catch();
      if (j && j[0] && j[0].type === "success")
        return {
          username: mailbox.local_part + "@" + mailbox.domain,
          password: mailbox.password,
          domain: mailbox.domain,
          name: mailbox.name,
          local_part: mailbox.local_part,
          quota: mailbox.quota,
        };
      console.error(j);
      return false;
    });
  }

  async deleteMailbox(mailboxes: any) {
    if (typeof mailboxes === "string") mailboxes = [mailboxes];
    if (!mailboxes[0].match(/[A-Z-a-z0-9]+\.[A-Z-a-z0-9]+$/))
      throw new Error("domain name is invalid");

    return f(`${this.baseurl}/api/v1/delete/mailbox`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailboxes),
    }).then(async (res: { json: () => Promise<any> }) => {
      const j = await res.json().catch();
      if (j && j[0] && j[0].type === "success") return true;
      console.error(j);
      return false;
    });
  }

  updateMailbox = async (mailbox: any): Promise<boolean> => {
    const response = await fetch(`${this.baseurl}/api/v1/edit/mailbox`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailbox),
    });

    const responseData = await response.json();

    if (response.status !== 200) {
      throw new Error(
        `${response.status} ${
          responseData === undefined ? "" : JSON.stringify(responseData)
        }`
      );
    }

    return true;
  };

  async rateLimitMailbox(mailbox: any): Promise<boolean> {
    if (!mailbox) throw new Error("Mailbox must be provided as Mailbox Object");

    const response = await fetch(`${this.baseurl}/api/v1/edit/rl-mbox/`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailbox),
    });

    const responseData = await response.json();

    if (responseData && responseData[0] && responseData[0].type === "success") {
      return true;
    } else {
      console.error(responseData);
      return false;
    }
  }

  async addAppPassword(mailbox: any): Promise<boolean> {
      if (!mailbox) throw new Error("Mailbox must be provided as Mailbox Object");

      const response = await fetch(`${this.baseurl}/api/v1/add/app-passwd`, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apikey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mailbox),
      });

      const responseData = await response.json();

      if (responseData && responseData[0] && responseData[0].type === "success") {
        return true;
      } else {
        console.error(responseData);
        return false;
      }
    }

  async deleteAppPassword(passwordId: string[]): Promise<boolean> {
      if (!passwordId || !Array.isArray(passwordId)) throw new Error("Password ID(s) must be provided as an array of strings.");

      const response = await fetch(`${this.baseurl}/api/v1/delete/app-passwd`, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apikey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordId),
      });

      const responseData = await response.json();

      if (responseData && responseData[0] && responseData[0].type === "success") {
        return true;
      } else {
        console.error(responseData);
        return false;
      }
  }

  async addAlias(alias: any) {
    if (!alias)
      throw new Error("Alias must be provided as an object");
  
    return f(`${this.baseurl}/api/v1/add/alias`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alias),
    })
      .then(async (res: { json: () => Promise<any> }) => {
        const j = await res.json().catch();
        if (j && j[0] && j[0].type === "success") return true;
        console.error(j);
        return false;
      });
  }
  
  async deleteAlias(aliasIds: string[]) {
    if (!aliasIds || !Array.isArray(aliasIds))
      throw new Error("Alias IDs must be provided as an array of strings.");
  
    return f(`${this.baseurl}/api/v1/delete/alias`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aliasIds),
    })
      .then(async (res: { json: () => Promise<any> }) => {
        const j = await res.json().catch();
        if (j && j[0] && j[0].type === "success") return true;
        console.error(j);
        return false;
      });
  }

  async getAlias(id: string): Promise<any> {
    const endpoint = `${this.baseurl}/api/v1/get/alias/${id}`;
  
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
    });
  
    const responseData = await response.json();
  
    if (responseData && response.status === 200) {
      return responseData;
    } else {
      console.error(responseData);
      throw new Error(responseData.msg);
    }
  };

  async updateAlias(alias: any, aliasId: string[]): Promise<boolean> {
    if (!alias || !Array.isArray(aliasId))
      throw new Error("Alias and Alias ID(s) must be provided.");
  
    const requestBody = {
      attr: alias,
      items: aliasId
    };
  
    const response = await fetch(`${this.baseurl}/api/v1/edit/alias`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  
    const responseData = await response.json();
  
    if (responseData && responseData[0] && responseData[0].type === "success") {
      return true;
    } else {
      console.error(responseData);
      return false;
    }
  }  

  async updateMailboxACL(mailbox: any, acl: any): Promise<boolean> {
    if (!mailbox) throw new Error("Mailbox must be provided as a string");
    if (!acl) throw new Error("ACL must be provided as an array of strings");

    const requestBody = {
      attr: {
        user_acl: acl
      },
      items: mailbox
    }

    const response = await fetch(`${this.baseurl}/api/v1/edit/user-acl`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (responseData && responseData[0] && responseData[0].type === "success") {
      return true;
    } else {
      console.error(responseData);
      return false;
    }
  }

  async getDomain(domain: string, tags?: string): Promise<any> {
    const endpoint = domain ? `${this.baseurl}/api/v1/get/domain/${domain}` : `${this.baseurl}/api/v1/get/domain/all`;
  
    let params: { [key: string]: string } = {};
  
    if(tags) {
      params['tags'] = tags;
    }
  
    const url = new URL(endpoint);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
    });
  
    const responseData = await response.json();
  
    if (responseData && response.status === 200) {
      return responseData;
    } else {
      console.error(responseData);
      throw new Error(responseData.msg);
    }
  };

  async getMailbox(mail: string, tags?: string): Promise<any> {
    const endpoint = mail ? `${this.baseurl}/api/v1/get/mailbox/${mail}` : `${this.baseurl}/api/v1/get/mailbox/all`;
  
    let params: { [key: string]: string } = {};
  
    if(tags) {
      params['tags'] = tags;
    }
  
    const url = new URL(endpoint);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
    });
  
    const responseData = await response.json();
  
    if (responseData && response.status === 200) {
      return responseData;
    } else {
      console.error(responseData);
      throw new Error(responseData.msg);
    }
  };


  async getMailboxesForDomain(domain: string): Promise<any> {
    const endpoint = `${this.baseurl}/api/v1/get/mailbox/all/${domain}`;
  
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
    });
  
    const responseData = await response.json();
  
    if (responseData && response.status === 200) {
      return responseData;
    } else {
      console.error(responseData);
      throw new Error(responseData.msg);
    }
  };
  
  async getDKIMForDomain(domain: string): Promise<any> {
    const endpoint = `${this.baseurl}/api/v1/get/dkim/${domain}`;
  
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-Api-Key": this.apikey,
        "Content-Type": "application/json",
      },
    });
  
    const responseData = await response.json();
  
    if (responseData && response.status === 200) {
      return responseData;
    } else {
      console.error(responseData);
      throw new Error(responseData.msg);
    }
  }; 

};