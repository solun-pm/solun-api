import { Request, Response } from 'express';
import { dbConnect, findOneDocument, findOneCASEDocument, User, User_Domains } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleAddDomainRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = req.body.user_id;
    let domain = req.body.domain;

    if (!user_id || !domain) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist" });
    }
    
    const checkIfDomainExists = await findOneDocument(User_Domains, { domain: domain });

    if (checkIfDomainExists) {
        return res.status(400).json({ message: "Domain already exists" });
    }

    // Create domain on mailserver
    const addDomain = await mcc.addDomain({
      active: 1,
      aliases: 2,
      backupmx: 0,
      defquota: 1024,
      description: "This domain got added by a Solun user via the interface",
      domain: domain,
      mailboxes: 2,
      maxquota: 40960,
      quota: 40960,
      rl_frame: "d",
      rl_value: 500,
    });
  
    if (!addDomain) {
      return res.status(500).json({ message: "Something went wrong" });
    }

    const createDKIM = await mcc.addDKIM({
      dkim_selector: "dkim",
      domains: domain,
      key_size: 2048
    });
    
    if (!createDKIM) {
      return res.status(500).json({ message: "Something went wrong" });
    }    

    const newDomain = new User_Domains({
        user_id: user_id,
        domain: domain,
        quota: 40960,
        membership: "free",
        verification_status: "pending",
        active: true,
    });

    await newDomain.save();

    const dkimResponse = await mcc.getDKIMForDomain(domain);

    if (!dkimResponse) {
      return res.status(500).json({ message: "Something went wrong" });
    }

  const dnsData = ([
    {
      type: 'MX',
      name: domain,
      data: 'ms.solun.pm'
    },
    {
      type: 'CNAME',
      name: 'autoconfig.' + domain,
      data: 'ms.solun.pm'
    },
    {
      type: 'CNAME',
      name: 'autodiscover.' + domain,
      data: 'ms.solun.pm'
    },
    {
      type: 'SRV',
      name: '_autodiscover._tcp.' + domain,
      data: 'ms.solun.pm 443'
    },
    {
      type: 'TXT',
      name: domain,
      data: 'v=spf1 include:solun.pm ~all'
    },
    {
      type: 'TXT',
      name: '_dmarc.' + domain,
      data: 'v=DMARC1;p=quarantine;rua=mailto:postmaster@solun.pm 2'
    },
    {
      type: 'TXT',
      name: 'dkim._domainkey.' + domain,
      data: dkimResponse.dkim_txt
    },
  ]);

    return res.status(200).json({ message: "Domain created successfully", dnsData: dnsData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}