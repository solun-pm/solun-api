import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User_Domains } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleGetDNSRecordsRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let domain = req.body.domain;

    if (!domain) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }
    
    const checkIfDomainExists = await findOneDocument(User_Domains, { domain: domain });

    if (!checkIfDomainExists) {
        return res.status(400).json({ message: "Domain does not exist" });
    }

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

    return res.status(200).json({ dnsData: dnsData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}