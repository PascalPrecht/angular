// TODO: This whole file is nearly identical to core/application.ts.
// There should be a way to refactor application so that this file is unnecessary
import {Injector, bind, Binding} from "angular2/di";
import {Type, isBlank, isPresent} from "angular2/src/facade/lang";
import {Reflector, reflector} from 'angular2/src/reflection/reflection';
import {List, ListWrapper} from 'angular2/src/facade/collection';
import {
  Parser,
  Lexer,
  ChangeDetection,
  DynamicChangeDetection,
  JitChangeDetection,
  PreGeneratedChangeDetection,
  Pipes,
  defaultPipes
} from 'angular2/change_detection';
import {EventManager, DomEventsPlugin} from 'angular2/src/render/dom/events/event_manager';
import {Compiler, CompilerCache} from 'angular2/src/core/compiler/compiler';
import {BrowserDomAdapter} from 'angular2/src/dom/browser_adapter';
import {KeyEventsPlugin} from 'angular2/src/render/dom/events/key_events';
import {HammerGesturesPlugin} from 'angular2/src/render/dom/events/hammer_gestures';
import {AppViewPool, APP_VIEW_POOL_CAPACITY} from 'angular2/src/core/compiler/view_pool';
import {Renderer, RenderCompiler} from 'angular2/src/render/api';
import {
  DomRenderer,
  DOCUMENT_TOKEN,
  DOM_REFLECT_PROPERTIES_AS_ATTRIBUTES
} from 'angular2/src/render/dom/dom_renderer';
import {DefaultDomCompiler} from 'angular2/src/render/dom/compiler/compiler';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {NgZone} from 'angular2/src/core/zone/ng_zone';
import {ShadowDomStrategy} from 'angular2/src/render/dom/shadow_dom/shadow_dom_strategy';
import {
  EmulatedUnscopedShadowDomStrategy
} from 'angular2/src/render/dom/shadow_dom/emulated_unscoped_shadow_dom_strategy';
import {AppViewManager} from 'angular2/src/core/compiler/view_manager';
import {AppViewManagerUtils} from 'angular2/src/core/compiler/view_manager_utils';
import {AppViewListener} from 'angular2/src/core/compiler/view_listener';
import {ProtoViewFactory} from 'angular2/src/core/compiler/proto_view_factory';
import {ViewResolver} from 'angular2/src/core/compiler/view_resolver';
import {ViewLoader} from 'angular2/src/render/dom/compiler/view_loader';
import {DirectiveResolver} from 'angular2/src/core/compiler/directive_resolver';
import {ExceptionHandler} from 'angular2/src/core/exception_handler';
import {ComponentUrlMapper} from 'angular2/src/core/compiler/component_url_mapper';
import {StyleInliner} from 'angular2/src/render/dom/compiler/style_inliner';
import {DynamicComponentLoader} from 'angular2/src/core/compiler/dynamic_component_loader';
import {StyleUrlResolver} from 'angular2/src/render/dom/compiler/style_url_resolver';
import {UrlResolver} from 'angular2/src/services/url_resolver';
import {Testability} from 'angular2/src/core/testability/testability';
import {XHR} from 'angular2/src/render/xhr';
import {XHRImpl} from 'angular2/src/render/xhr_impl';
import {Serializer} from 'angular2/src/web-workers/shared/serializer';
import {ON_WEBWORKER} from 'angular2/src/web-workers/shared/api';
import {RenderProtoViewRefStore} from 'angular2/src/web-workers/shared/render_proto_view_ref_store';
import {
  RenderViewWithFragmentsStore
} from 'angular2/src/web-workers/shared/render_view_with_fragments_store';
import {AnchorBasedAppRootUrl} from 'angular2/src/services/anchor_based_app_root_url';
import {WebWorkerMain} from 'angular2/src/web-workers/ui/impl';

var _rootInjector: Injector;

// Contains everything that is safe to share between applications.
var _rootBindings = [bind(Reflector).toValue(reflector)];

// TODO: This code is nearly identitcal to core/application. There should be a way to only write it
// once
function _injectorBindings(): List<Type | Binding | List<any>> {
  var bestChangeDetection: Type = DynamicChangeDetection;
  if (PreGeneratedChangeDetection.isSupported()) {
    bestChangeDetection = PreGeneratedChangeDetection;
  } else if (JitChangeDetection.isSupported()) {
    bestChangeDetection = JitChangeDetection;
  }
  // compute the root url to pass to AppRootUrl
  /*var rootUrl: string;
  var a = DOM.createElement('a');
  DOM.resolveAndSetHref(a, './', null);
  rootUrl = DOM.getHref(a);*/

  return [
    bind(DOCUMENT_TOKEN)
        .toValue(DOM.defaultDoc()),
    bind(EventManager)
        .toFactory(
            (ngZone) => {
              var plugins =
                  [new HammerGesturesPlugin(), new KeyEventsPlugin(), new DomEventsPlugin()];
              return new EventManager(plugins, ngZone);
            },
            [NgZone]),
    bind(ShadowDomStrategy)
        .toFactory((doc) => new EmulatedUnscopedShadowDomStrategy(doc.head), [DOCUMENT_TOKEN]),
    bind(DOM_REFLECT_PROPERTIES_AS_ATTRIBUTES).toValue(false),
    DomRenderer,
    DefaultDomCompiler,
    Serializer,
    bind(Renderer).toAlias(DomRenderer),
    bind(RenderCompiler).toAlias(DefaultDomCompiler),
    bind(ON_WEBWORKER).toValue(false),
    RenderViewWithFragmentsStore,
    RenderProtoViewRefStore,
    ProtoViewFactory,
    AppViewPool,
    bind(APP_VIEW_POOL_CAPACITY).toValue(10000),
    AppViewManager,
    AppViewManagerUtils,
    AppViewListener,
    Compiler,
    CompilerCache,
    ViewResolver,
    bind(Pipes).toValue(defaultPipes),
    bind(ChangeDetection).toClass(bestChangeDetection),
    ViewLoader,
    DirectiveResolver,
    Parser,
    Lexer,
    ExceptionHandler,
    bind(XHR).toValue(new XHRImpl()),
    ComponentUrlMapper,
    UrlResolver,
    StyleUrlResolver,
    StyleInliner,
    DynamicComponentLoader,
    Testability,
    AnchorBasedAppRootUrl,
    WebWorkerMain
  ];
}

export function createInjector(zone: NgZone): Injector {
  BrowserDomAdapter.makeCurrent();
  _rootBindings.push(bind(NgZone).toValue(zone));
  var injector: Injector = Injector.resolveAndCreate(_rootBindings);
  return injector.resolveAndCreateChild(_injectorBindings());
}
