const {test} = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const options = {phoneNumberId:'test-phone', accessToken:'test-only-token', to:'+15550001111', cards:[
  {title:'Card A',description:'First',headerImage:'https://example.test/a.png',buttons:[{id:'buy_a',title:'Select'}]},
  {title:'Card B',description:'Second',headerImage:'https://example.test/b.png',buttons:[{id:'buy_b',title:'Select'}]},
]};
function client(post) {
  return load('src/lib/meta/api.ts',{axios:{post,isAxiosError:()=>true},'./catalog':{},'./checkout':{}}).MetaWhatsAppClient;
}
test('missing carousel template fails without sending a disguised list',async()=>{
  let calls=0;const result=await client(async()=>{calls++;}).sendCarouselTemplate(options);
  assert.equal(result.success,false);assert.equal(calls,0);assert.match(result.error,/approved Meta carousel template/);
});
test('rejected carousel template returns original provider error without fallback send',async()=>{
  let calls=0;const result=await client(async()=>{calls++;throw {response:{data:{error:{message:'Template not approved',code:132001}}}};}).sendCarouselTemplate({...options,templateName:'catalog_approved'});
  assert.equal(result.success,false);assert.equal(result.errorCode,132001);assert.equal(calls,1);
});
test('accepted carousel carries stable card button payloads and real provider message ID',async()=>{
  let payload;const result=await client(async(_url,body)=>{payload=body;return {data:{messages:[{id:'wamid.real'}]}};}).sendCarouselTemplate({...options,templateName:'catalog_approved'});
  assert.equal(result.success,true);assert.equal(result.messageId,'wamid.real');assert.equal(payload.type,'template');
  assert.equal(payload.template.components[0].cards[1].components[2].parameters[0].payload,'buy_b');
});
test('missing provider message IDs cannot become synthetic successful sends',async()=>{
  const api=client(async()=>({data:{messages:[]}}));
  assert.equal((await api.sendCarouselTemplate({...options,templateName:'catalog_approved'})).success,false);
  assert.equal((await api.sendInteractiveButtons({...options,bodyText:'Choose',buttons:[{id:'one',title:'One'}]})).success,false);
});

test('carousel templates use the template messaging policy outside the care window',async()=>{
  let sent=0;
  const {WhatsAppMessageService}=load('src/lib/whatsapp/messageService.ts',{
    '@/lib/db':{DEFAULT_WORKSPACE_ID:'workspace-a',SettingsDB:{get:async()=>({phoneNumberId:'phone-a',accessToken:'credential-for-unit-test'})},
      ContactsDB:{upsert:async()=>({id:'contact-a'})},MessagesDB:{create:async msg=>({...msg,id:'message-a'})},
      ConversationsDB:{isWindowOpen:async()=>false,recordOutbound:async()=>{}}},
    '@/lib/crypto':{decryptToken:v=>v},'@/lib/meta/api':{MetaWhatsAppClient:{sendCarouselTemplate:async()=>{sent++;return {success:true,messageId:'wamid.real'};}}},
    './messageModel':{
      canonicalizeOutboundMessage:value=>value,
      validateOutboundMessage:value=>value.templateName?[]:['Select an approved carousel template before sending.'],
      dbMessageType:kind=>kind,
    },
  });
  const accepted=await WhatsAppMessageService.send({workspaceId:'workspace-a',to:'+15550001111',type:'carousel',templateName:'approved_catalog',cards:options.cards});
  assert.equal(accepted.success,true);assert.equal(sent,1);
  const ordinary=await WhatsAppMessageService.send({workspaceId:'workspace-a',to:'+15550001111',type:'carousel',cards:options.cards});
  assert.equal(ordinary.success,false);assert.match(ordinary.error,/approved carousel template/);assert.equal(sent,1);
});

test('catalog product sends reject missing provider IDs',async()=>{
  const catalog=load('src/lib/meta/catalog.ts',{axios:{post:async()=>({data:{messages:[]}})},'./catalogTypes':{}});
  assert.equal((await catalog.sendSingleProductMessage({...options,catalogId:'catalog',productRetailerId:'item'})).success,false);
  assert.equal((await catalog.sendMultiProductMessage({...options,catalogId:'catalog',headerText:'Products',bodyText:'Browse',sections:[]})).success,false);
});
test('checkout cannot invent a payment link or simulate a successful send without credentials',async()=>{
  let sent=0;
  const checkout=load('src/lib/meta/checkout.ts',{'./api':{MetaWhatsAppClient:{sendInteractiveButtons:async()=>{sent++;return {success:true,messageId:'wamid.real'};}}}});
  const order={to:'+15550001111',phoneNumberId:'',accessToken:'',productName:'Product',price:'10',orderId:'test-order'};
  assert.equal((await checkout.sendCheckoutResponse(order)).success,false);
  assert.equal((await checkout.sendCheckoutResponse({...order,paymentUrl:'https://merchant.example.test/pay/test-order'})).success,false);
  assert.equal((await checkout.sendCheckoutResponse({...order,phoneNumberId:'phone',accessToken:'test-token',paymentUrl:'javascript:alert(1)'})).success,false);
  assert.equal(sent,0);
});
