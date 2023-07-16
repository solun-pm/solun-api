export function checkPlanCaps(plan: string){
    const caps = [];
    if (plan === 'free'){
        caps.push({
            name: 'free',
            maxAliases: 4,
            maxMailboxes: 2,
            maxDomains: 1,
        });
    }
    return caps;
}