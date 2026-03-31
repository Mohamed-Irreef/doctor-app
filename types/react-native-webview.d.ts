declare module "react-native-webview" {
  import * as React from "react";
    import { ViewProps } from "react-native";

  export interface WebViewProps extends ViewProps {
    source?: { uri?: string } | { html?: string };
    onLoadEnd?: () => void;
    startInLoadingState?: boolean;
    originWhitelist?: string[];
  }

  export class WebView extends React.Component<WebViewProps> {}
  export default WebView;
}
