import type { SupplierVO } from '../types'

export const SUPPLIER_MOCK_LIST: SupplierVO[] = [
  {
    "id": 1,
    "code": "SUP20260801001",
    "name": "深圳华南电子科技",
    "shortName": "华南电子",
    "status": "ACTIVE",
    "capabilityTags": [
      "manufacturer",
      "trader"
    ],
    "category": [
      "equity",
      "dining"
    ],
    "productType": [
      "equity_product",
      "jd"
    ],
    "productCategory": [
      "electronics"
    ],
    "supplyMode": [
      "dropshipping",
      "api"
    ],
    "deliveryAreaType": "nationwide",
    "deliveryAreaId": null,
    "shippingTimeliness": "same_day",
    "shippingTimelinessCustom": "",
    "supportAfterSale": true,
    "companyName": "深圳华南电子科技有限公司",
    "socialCreditCode": "91440300MA5EXAMPLE1",
    "businessLicenseUrls": [],
    "legalPersonName": "张明",
    "legalIdUrls": [],
    "legalPersonMobile": "13800138001",
    "contactAddress": "深圳市南山区科技园南路1号",
    "settlementType": "monthly",
    "settlementCycle": 30,
    "integrationMethods": [
      "api"
    ],
    "accessDate": "2026-07-15",
    "accessTime": "2026-07-15 09:30:00",
    "cooperationRemark": "主要供应电子元器件",
    "bankName": "中国银行深圳南山支行",
    "bankAccount": "6217000000000000001",
    "accountBalance": 86000,
    "otherCertUrls": [],
    "remark": "主要供应电子元器件",
    "contacts": [
      {
        "id": 11,
        "name": "张明",
        "mobile": "13800138001",
        "email": "zhangming@hndz.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 101,
        "categoryCode": "equity",
        "categoryName": "权益商品",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "virtual_card",
        "productCategoryName": "虚拟卡券类",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 9999999,
        "minOrderQty": 1
      },
      {
        "id": 102,
        "categoryCode": "dining",
        "categoryName": "点餐",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "electronics",
        "productCategoryName": "数码电子",
        "supplyMode": ["batch"],
        "supplyLimit": 50000,
        "minOrderQty": 1
      }
    ],
    "productCount": 36,
    "skuCount": 36,
    "contactName": "张明",
    "contactMobile": "13800138001",
    "createTime": "2026-07-15 09:30:00",
    "updateTime": "2026-08-20 14:22:10"
  },
  {
    "id": 2,
    "code": "SUP20260622002",
    "name": "广州新达包装材料",
    "shortName": "新达包装",
    "status": "ACTIVE",
    "capabilityTags": [
      "trader"
    ],
    "category": [
      "hema"
    ],
    "productType": [
      "jd"
    ],
    "productCategory": [
      "electronics",
      "virtual_card"
    ],
    "supplyMode": [
      "batch",
      "pickup"
    ],
    "deliveryAreaType": "specified",
    "deliveryAreaId": 440100,
    "shippingTimeliness": "next_day",
    "shippingTimelinessCustom": "",
    "supportAfterSale": true,
    "companyName": "广州市新达包装材料有限公司",
    "socialCreditCode": "91440100MA5EXAMPLE2",
    "businessLicenseUrls": [],
    "legalPersonName": "李芳",
    "legalIdUrls": [],
    "legalPersonMobile": "13900139002",
    "contactAddress": "广州市白云区物流大道88号",
    "settlementType": "monthly",
    "settlementCycle": 45,
    "integrationMethods": [
      "manual"
    ],
    "accessDate": "2026-06-22",
    "accessTime": "2026-06-22 11:05:00",
    "cooperationRemark": "纸箱、彩盒包装",
    "bankName": "工商银行广州白云支行",
    "bankAccount": "6222020000000000002",
    "accountBalance": 42000,
    "otherCertUrls": [],
    "remark": "纸箱、彩盒包装",
    "contacts": [
      {
        "id": 21,
        "name": "李芳",
        "mobile": "13900139002",
        "email": "lifang@xinda.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 201,
        "categoryCode": "hema",
        "categoryName": "盒马购",
        "productType": "jd",
        "productTypeName": "京东",
        "productCategory": "electronics",
        "productCategoryName": "数码电子",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 200000,
        "minOrderQty": 5
      }
    ],
    "productCount": 18,
    "skuCount": 18,
    "contactName": "李芳",
    "contactMobile": "13900139002",
    "createTime": "2026-06-22 11:05:00",
    "updateTime": "2026-08-18 16:40:33"
  },
  {
    "id": 3,
    "code": "SUP20260510003",
    "name": "浙江沪丰五金制品",
    "shortName": "沪丰五金",
    "status": "SUSPENDED",
    "capabilityTags": [
      "manufacturer"
    ],
    "category": [
      "equity"
    ],
    "productType": [
      "equity_product"
    ],
    "productCategory": [
      "virtual_card"
    ],
    "supplyMode": [
      "batch"
    ],
    "deliveryAreaType": "nationwide",
    "deliveryAreaId": null,
    "shippingTimeliness": "48h",
    "shippingTimelinessCustom": "",
    "supportAfterSale": false,
    "companyName": "浙江沪丰五金制品股份有限公司",
    "socialCreditCode": "91330000MA5EXAMPLE3",
    "businessLicenseUrls": [],
    "legalPersonName": "王强",
    "legalIdUrls": [],
    "legalPersonMobile": "13700137003",
    "contactAddress": "浙江省嘉兴市南湖区工业园",
    "settlementType": "weekly",
    "settlementCycle": 7,
    "integrationMethods": [
      "api",
      "h5"
    ],
    "accessDate": "2026-05-10",
    "accessTime": "2026-05-10 08:15:00",
    "cooperationRemark": "暂停供货：质量整改中",
    "bankName": "建设银行嘉兴南湖支行",
    "bankAccount": "6217000000000000003",
    "accountBalance": 15000,
    "otherCertUrls": [],
    "remark": "暂停供货：质量整改中",
    "contacts": [
      {
        "id": 31,
        "name": "王强",
        "mobile": "13700137003",
        "email": "wangqiang@hufeng.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 301,
        "categoryCode": "equity",
        "categoryName": "权益商品",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "virtual_card",
        "productCategoryName": "虚拟卡券类",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 100000,
        "minOrderQty": 1
      }
    ],
    "productCount": 52,
    "skuCount": 52,
    "contactName": "王强",
    "contactMobile": "13700137003",
    "createTime": "2026-05-10 08:15:00",
    "updateTime": "2026-08-05 10:12:45"
  },
  {
    "id": 4,
    "code": "SUP20260701004",
    "name": "上海瑞通贸易",
    "shortName": "瑞通贸易",
    "status": "ACTIVE",
    "capabilityTags": [
      "trader",
      "distributor"
    ],
    "category": [
      "equity",
      "movie"
    ],
    "productType": [
      "equity_product",
      "movie"
    ],
    "productCategory": [
      "movie_ticket"
    ],
    "supplyMode": [
      "dropshipping",
      "h5"
    ],
    "deliveryAreaType": "nationwide",
    "deliveryAreaId": null,
    "shippingTimeliness": "next_day",
    "shippingTimelinessCustom": "",
    "supportAfterSale": true,
    "companyName": "上海瑞通国际贸易有限公司",
    "socialCreditCode": "91310000MA5EXAMPLE4",
    "businessLicenseUrls": [],
    "legalPersonName": "陈丽",
    "legalIdUrls": [],
    "legalPersonMobile": "13600136004",
    "contactAddress": "上海市浦东新区陆家嘴环路1000号",
    "settlementType": "monthly",
    "settlementCycle": 30,
    "integrationMethods": [
      "h5"
    ],
    "accessDate": "2026-07-01",
    "accessTime": "2026-07-01 13:20:00",
    "cooperationRemark": "进口原材料代理",
    "bankName": "招商银行上海陆家嘴支行",
    "bankAccount": "6214830000000000004",
    "accountBalance": 128000,
    "otherCertUrls": [],
    "remark": "进口原材料代理",
    "contacts": [
      {
        "id": 41,
        "name": "陈丽",
        "mobile": "13600136004",
        "email": "chenli@ruitong.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 401,
        "categoryCode": "equity",
        "categoryName": "权益商品",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "virtual_card",
        "productCategoryName": "虚拟卡券类",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 9999999,
        "minOrderQty": 1
      },
      {
        "id": 402,
        "categoryCode": "movie",
        "categoryName": "电影快充",
        "productType": "movie",
        "productTypeName": "电影",
        "productCategory": "movie_ticket",
        "productCategoryName": "电影快票",
        "supplyMode": ["batch"],
        "supplyLimit": 50000,
        "minOrderQty": 1
      }
    ],
    "productCount": 27,
    "skuCount": 27,
    "contactName": "陈丽",
    "contactMobile": "13600136004",
    "createTime": "2026-07-01 13:20:00",
    "updateTime": "2026-08-25 09:08:00"
  },
  {
    "id": 5,
    "code": "SUP20260418005",
    "name": "东莞恒昌塑胶模具",
    "shortName": "恒昌塑胶",
    "status": "BLACKLIST",
    "capabilityTags": [
      "manufacturer"
    ],
    "category": [
      "hema"
    ],
    "productType": [
      "jd"
    ],
    "productCategory": [
      "electronics"
    ],
    "supplyMode": [
      "batch",
      "pickup"
    ],
    "deliveryAreaType": "specified",
    "deliveryAreaId": 441900,
    "shippingTimeliness": "72h",
    "shippingTimelinessCustom": "",
    "supportAfterSale": false,
    "companyName": "东莞市恒昌塑胶模具有限公司",
    "socialCreditCode": "91441900MA5EXAMPLE5",
    "businessLicenseUrls": [],
    "legalPersonName": "刘伟",
    "legalIdUrls": [],
    "legalPersonMobile": "13500135005",
    "contactAddress": "东莞市长安镇工业大道66号",
    "settlementType": "prepaid",
    "settlementCycle": 0,
    "integrationMethods": [
      "manual"
    ],
    "accessDate": "2026-04-18",
    "accessTime": "2026-04-18 10:00:00",
    "cooperationRemark": "黑名单：交期严重违约",
    "bankName": "农业银行东莞长安支行",
    "bankAccount": "6228480000000000005",
    "accountBalance": 0,
    "otherCertUrls": [],
    "remark": "黑名单：交期严重违约",
    "contacts": [
      {
        "id": 51,
        "name": "刘伟",
        "mobile": "13500135005",
        "email": "liuwei@hengchang.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 501,
        "categoryCode": "hema",
        "categoryName": "盒马购",
        "productType": "jd",
        "productTypeName": "京东",
        "productCategory": "electronics",
        "productCategoryName": "数码电子",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 30000,
        "minOrderQty": 1
      }
    ],
    "productCount": 8,
    "skuCount": 8,
    "contactName": "刘伟",
    "contactMobile": "13500135005",
    "createTime": "2026-04-18 10:00:00",
    "updateTime": "2026-07-30 17:55:20"
  },
  {
    "id": 6,
    "code": "SUP20260801006",
    "name": "苏州科信自动化设备",
    "shortName": "科信自动化",
    "status": "ACTIVE",
    "capabilityTags": [
      "service"
    ],
    "category": [
      "movie"
    ],
    "productType": [
      "movie"
    ],
    "productCategory": [
      "movie_ticket"
    ],
    "supplyMode": [
      "api"
    ],
    "deliveryAreaType": "nationwide",
    "deliveryAreaId": null,
    "shippingTimeliness": "same_day",
    "shippingTimelinessCustom": "",
    "supportAfterSale": true,
    "companyName": "苏州科信自动化设备有限公司",
    "socialCreditCode": "91320500MA5EXAMPLE6",
    "businessLicenseUrls": [],
    "legalPersonName": "赵敏",
    "legalIdUrls": [],
    "legalPersonMobile": "13400134006",
    "contactAddress": "苏州市工业园区星湖街328号",
    "settlementType": "monthly",
    "settlementCycle": 30,
    "integrationMethods": [
      "api"
    ],
    "accessDate": "2026-08-01",
    "accessTime": "2026-08-01 14:45:00",
    "cooperationRemark": "自动化设备维保服务",
    "bankName": "交通银行苏州园区支行",
    "bankAccount": "6222600000000000006",
    "accountBalance": 56000,
    "otherCertUrls": [],
    "remark": "自动化设备维保服务",
    "contacts": [
      {
        "id": 61,
        "name": "赵敏",
        "mobile": "13400134006",
        "email": "zhaomin@kexin.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 601,
        "categoryCode": "movie",
        "categoryName": "电影快充",
        "productType": "movie",
        "productTypeName": "电影",
        "productCategory": "movie_ticket",
        "productCategoryName": "电影快票",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 80000,
        "minOrderQty": 1
      }
    ],
    "productCount": 14,
    "skuCount": 14,
    "contactName": "赵敏",
    "contactMobile": "13400134006",
    "createTime": "2026-08-01 14:45:00",
    "updateTime": "2026-08-28 11:30:15"
  },
  {
    "id": 7,
    "code": "SUP20260605007",
    "name": "福建闽辉纺织",
    "shortName": "闽辉纺织",
    "status": "SUSPENDED",
    "capabilityTags": [
      "manufacturer",
      "trader"
    ],
    "category": [
      "equity",
      "dining"
    ],
    "productType": [
      "equity_product",
      "jd"
    ],
    "productCategory": [
      "virtual_card",
      "electronics"
    ],
    "supplyMode": [
      "dropshipping",
      "batch"
    ],
    "deliveryAreaType": "specified",
    "deliveryAreaId": 350100,
    "shippingTimeliness": "custom",
    "shippingTimelinessCustom": "下单后3天内发货",
    "supportAfterSale": true,
    "companyName": "福建闽辉纺织有限公司",
    "socialCreditCode": "91350000MA5EXAMPLE7",
    "businessLicenseUrls": [],
    "legalPersonName": "孙杰",
    "legalIdUrls": [],
    "legalPersonMobile": "13300133007",
    "contactAddress": "福州市仓山区纺织工业园",
    "settlementType": "quarterly",
    "settlementCycle": 90,
    "integrationMethods": [
      "api",
      "manual"
    ],
    "accessDate": "2026-06-05",
    "accessTime": "2026-06-05 09:00:00",
    "cooperationRemark": "暂停供货：价格调整协商中",
    "bankName": "兴业银行福州仓山支行",
    "bankAccount": "6229080000000000007",
    "accountBalance": 23000,
    "otherCertUrls": [],
    "remark": "暂停供货：价格调整协商中",
    "contacts": [
      {
        "id": 71,
        "name": "孙杰",
        "mobile": "13300133007",
        "email": "sunjie@minhui.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 701,
        "categoryCode": "equity",
        "categoryName": "权益商品",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "virtual_card",
        "productCategoryName": "虚拟卡券类",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 60000,
        "minOrderQty": 1
      },
      {
        "id": 702,
        "categoryCode": "dining",
        "categoryName": "点餐",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "electronics",
        "productCategoryName": "数码电子",
        "supplyMode": ["batch"],
        "supplyLimit": 40000,
        "minOrderQty": 1
      }
    ],
    "productCount": 41,
    "skuCount": 41,
    "contactName": "孙杰",
    "contactMobile": "13300133007",
    "createTime": "2026-06-05 09:00:00",
    "updateTime": "2026-08-15 15:20:30"
  },
  {
    "id": 8,
    "code": "SUP20260810008",
    "name": "北京中科智控科技",
    "shortName": "中科智控",
    "status": "ACTIVE",
    "capabilityTags": [
      "service",
      "distributor"
    ],
    "category": [
      "equity"
    ],
    "productType": [
      "equity_product"
    ],
    "productCategory": [
      "virtual_card"
    ],
    "supplyMode": [
      "api",
      "h5"
    ],
    "deliveryAreaType": "nationwide",
    "deliveryAreaId": null,
    "shippingTimeliness": "same_day",
    "shippingTimelinessCustom": "",
    "supportAfterSale": true,
    "companyName": "北京中科智控科技有限公司",
    "socialCreditCode": "91110000MA5EXAMPLE8",
    "businessLicenseUrls": [],
    "legalPersonName": "周婷",
    "legalIdUrls": [],
    "legalPersonMobile": "13200132008",
    "contactAddress": "北京市海淀区中关村大街1号",
    "settlementType": "monthly",
    "settlementCycle": 30,
    "integrationMethods": [
      "api",
      "h5"
    ],
    "accessDate": "2026-08-10",
    "accessTime": "2026-08-10 16:30:00",
    "cooperationRemark": "软件与系统集成服务",
    "bankName": "北京银行中关村支行",
    "bankAccount": "6214680000000000008",
    "accountBalance": 99000,
    "otherCertUrls": [],
    "remark": "软件与系统集成服务",
    "contacts": [
      {
        "id": 81,
        "name": "周婷",
        "mobile": "13200132008",
        "email": "zhouting@zkzk.com"
      }
    ],
    "supplyConfigs": [
      {
        "id": 801,
        "categoryCode": "equity",
        "categoryName": "权益商品",
        "productType": "equity_product",
        "productTypeName": "权益商品",
        "productCategory": "virtual_card",
        "productCategoryName": "虚拟卡券类",
        "supplyMode": ["dropshipping"],
        "supplyLimit": 9999999,
        "minOrderQty": 1
      }
    ],
    "productCount": 9,
    "skuCount": 9,
    "contactName": "周婷",
    "contactMobile": "13200132008",
    "createTime": "2026-08-10 16:30:00",
    "updateTime": "2026-08-29 08:45:00"
  }
]
