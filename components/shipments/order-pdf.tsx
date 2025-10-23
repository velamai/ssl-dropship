import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { generateBarcode } from "@/lib/barcode";

interface LabelProps {
  destinationName: string;
  destinationAddress: string[];
  destinationPostcode: string;
  returnAddress: string[];
  date: string;
  weight: string;
  code: string;
  shipmentId: string;
  qrCodeData: string | undefined;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    padding: 10,
    fontSize: 10,
  },
  left: {
    flex: 1,
    border: "1px solid black",
    padding: 6,
    marginRight: 4,
  },
  right: {
    flex: 1,
    border: "1px dashed black",
    padding: 6,
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  box: {
    border: "1px solid black",
    padding: 4,
    marginBottom: 6,
  },
  bold: {
    fontSize: 12,
    fontWeight: "bold",
  },
  barcode: {
    width: "55%",
    height: 120,
    marginVertical: 16,
  },
  barcodeBottom: {
    width: "60%",
    height: 120,
    marginTop: 16,
  },
  textCenter: {
    textAlign: "center",
  },

  container: {
    border: "2px solid black",
    width: "60%",
  },
  destinationHeader: {
    backgroundColor: "white",
    borderBottom: "2px solid black",
    padding: 4,
    fontWeight: "bold",
  },
  destinationHeader2: {
    backgroundColor: "white",
    padding: 4,
    fontWeight: "bold",
  },
  contentArea: {
    flexDirection: "row",
    padding: 6,
  },
  leftContent: {
    flex: 2,
  },
  rightContent: {
    flex: 1,
    // alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingLeft: 8,
  },
  addressBox: {
    padding: 4,
    marginBottom: 6,
  },
  postcodeBox: {
    padding: 6,
    marginBottom: 6,
    backgroundColor: "white",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid black",
  },
  tableCell: {
    flex: 1,
    padding: 4,
    borderRight: "1px solid black",
  },
  tableCellLast: {
    flex: 1,
    padding: 4,
  },
  tableContainer: {
    border: "2px solid black",
    marginBottom: 6,
  },
  routingCode: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  routingCodeSmall: {
    fontSize: 12,
    marginBottom: 2,
  },

  barcodeCode: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
});

const OrderPdf: React.FC<LabelProps> = (props) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* LEFT PART */}
        <View style={styles.left}>
          <Image src={props.qrCodeData} style={styles.barcode} />

          <View style={{ flexDirection: "row" }}>
            <View style={styles.container}>
              {/* Destination Header */}
              <View style={styles.destinationHeader}>
                <Text>Destination</Text>
              </View>

              {/* Content Area with routing codes on right */}
              <View style={styles.contentArea}>
                <View style={styles.leftContent}>
                  {/* Destination Address */}
                  <View style={styles.addressBox}>
                    <Text>{props.destinationName}</Text>
                    {props.destinationAddress.map((line, i) => (
                      <Text key={i}>{line}</Text>
                    ))}
                  </View>

                  {/* Postcode Box */}
                  <View style={styles.postcodeBox}>
                    <Text>{props.destinationPostcode}</Text>
                  </View>

                  {/* Table for Date/Weight/Ref */}
                  <View style={styles.tableContainer}>
                    <View style={styles.tableRow}>
                      <View style={styles.tableCell}>
                        <Text style={{ fontWeight: "bold" }}>Date</Text>
                      </View>
                      <View style={styles.tableCellLast}>
                        <Text>{props.date}</Text>
                      </View>
                    </View>
                    <View style={styles.tableRow}>
                      <View style={styles.tableCell}>
                        <Text style={{ fontWeight: "bold" }}>Weight</Text>
                      </View>
                      <View style={styles.tableCellLast}>
                        <Text>{props.weight}</Text>
                      </View>
                    </View>
                    {/* <View style={styles.tableRow}>
                    <View style={styles.tableCell}>
                      <Text style={{ fontWeight: "bold" }}>Ref 1</Text>
                    </View>
                    <View style={styles.tableCellLast}>
                      <Text>{props.ref1}</Text>
                    </View>
                  </View> */}
                    {/* <View style={{ flexDirection: "row" }}>
                    <View style={styles.tableCell}>
                      <Text style={{ fontWeight: "bold" }}>Ref 2</Text>
                    </View>
                    <View style={styles.tableCellLast}>
                      <Text>{props.ref2 || ""}</Text>
                    </View>
                  </View> */}
                  </View>
                </View>

                {/* Routing Codes on Right */}
              </View>
            </View>

            <View style={styles.rightContent}>
              <Text style={styles.routingCodeSmall}>{props.code}</Text>
              <Text style={styles.routingCodeSmall}>{props.shipmentId}</Text>
            </View>
          </View>

          {/* Bottom barcode */}
          {/* <Image src={props.qrCodeData} style={styles.barcodeBottom} />
          <Text style={styles.textCenter}>{props.code}</Text> */}
        </View>

        {/* RIGHT PART */}
        <View style={styles.right}>
          <Text style={{ marginBottom: 6 }}>
            Please place this note inside your parcel.
          </Text>

          <Image src={props.qrCodeData} style={styles.barcode} />
          <Text style={[styles.textCenter, { marginBottom: 6 }]}>
            {props.code}
          </Text>

          <View style={styles.box}>
            <Text style={styles.destinationHeader2}>Destination Address</Text>
            <Text>{props.destinationName}</Text>
            {props.destinationAddress.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            <Text>{props.destinationPostcode}</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.destinationHeader2}>Return Address</Text>
            {props.returnAddress.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default OrderPdf;
