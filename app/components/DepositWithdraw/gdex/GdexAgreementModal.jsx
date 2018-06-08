import React from "react";
import {connect} from "alt-react";
import SettingsStore from "../../../stores/SettingsStore";
import Ps from "perfect-scrollbar";
import PropTypes from "prop-types";

class GdexAgreementModal extends React.Component {
    static propTypes = {
        locale: PropTypes.string
    };

    constructor(props) {
        super();
        this.state = {
            locale: props.settings.get("locale", "en")
        };
    }

    componentDidMount() {
        // console.log(this.refs);
        if (this.refs.agreement) {
            let item = this.refs.agreement;
            // console.log(item);
            Ps.initialize(item);
        }
    }

    componentDidUpdate() {
        // console.log(this.refs);
        if (this.refs.agreement) {
            let item = this.refs.agreement;
            // console.log(item);
            Ps.update(item);
        }
    }

    _getAgreement(locale) {
        switch (locale) {
            case "zh":
            case "cn":
                return (
                    <div
                        className="container"
                        ref="agreement"
                        style={{
                            height: "500px",
                            overflow: "auto",
                            position: "relative"
                        }}
                    >
                        <h2 style={{textAlign: "center"}}>用户服务协议</h2>
                        <p>
                            OBSIDIAN TECHNOLOGY CO. PTE. LTD.
                            是一家根据新加坡共和国法律成立的公司，GDEX是由该公司运营的比特股网关(以下称“GDEX”或“本网关”)，主访问入口为https://www.gdex.io，GDEX是一个在比特股平台为用户提供数字资产充提服务（以下称“该服务”或“服务”）的平台。为了本协议表述之方便，公司和该网关在本协议中合称使用“我们”或其他第一人称称呼。使用该服务的自然人或其他主体均为本网关的用户，本协议为表述之便利，以下使用“您”或其他第二人称。我们和您在本协议中合称为“双方”，我们或您单称为“一方”。
                        </p>
                        <p>重要提示：</p>
                        <p>我们在此特别提醒您：</p>
                        <p>
                            {" "}
                            1. 数字资产本身不由任何金融机构或公司或本网关发行；
                        </p>
                        <p>
                            {" "}
                            2.
                            数字资产市场是全新的、未经确认的，而且可能不会增长；
                        </p>
                        <p>
                            {" "}
                            3.
                            数字资产主要由投机者大量使用，零售和商业市场使用相对较少，数字资产交易存在极高风险，其全天不间断交易，没有涨跌限制，价格容易受庄家、全球政府政策的影响而大幅波动；
                        </p>
                        <p>
                            {" "}
                            4.
                            因各国法律、法规和规范性文件的制定或者修改，数字资产交易随时可能被暂停或被禁止。
                        </p>
                        <p>
                            数字资产交易有极高风险，并不适合绝大部分人士。您了解和理解此投资有可能导致部分损失或全部损失，所以您应该以能承受的损失程度来决定投资的金额。您了解和理解数字资产会产生衍生风险，所以如有任何疑问，建议先寻求理财顾问的协助。此外，除了上述提及过的风险以外，还会有未能预测的风险存在。您应慎重考虑并用清晰的判断能力去评估自己的财政状况及上述各项风险而作出任何买卖数字资产的决定，并承担由此产生的全部损失，我们对此不承担任何责任。
                        </p>
                        <p>敬告您：</p>
                        <p>
                            1.您了解比特股是基于区块链的去中心化交易平台，其基础账号服务和交易撮合服务都由比特股平台提供。亦有其它机构或个人在比特股平台上发行资产及／或提供服务。您了解本网关仅作为您向比特股平台充提数字资产的工具。本网关只对自身发行的交易代币资产（名称以GDEX.为前缀）负责，不对比特股上其它机构或个人发行的资产负责，本网关不参与您的任何交易，您应自行谨慎判断确定相关数字资产及/或信息的真实性、合法性和有效性，并自行承担因此产生的责任与损失。
                        </p>
                        <p>
                            {" "}
                            2.
                            比特股去中心化交易系统存有风险，包括但不限于软件，硬件和互联网链结的失败，用户账户系统的安全风险等。由于我们不能控制互联网以及比特股平台的可靠性和可用性，我们不会对上述风险造成的用户损失承担任何责任。
                        </p>
                        <p>
                            {" "}
                            3.
                            禁止使用本网关从事洗钱、走私、商业贿赂等一切非法交易活动，若发现此类事件，本网关将采取各种可使用之手段，包括但不限于中止提供服务，通知相关权力机关等，我们不承担由此产生的所有责任并保留向相关人士追究责任的权利。
                        </p>
                        <p>一、总则</p>
                        <p>
                            {" "}
                            1.1
                            您在使用本网关提供的服务之前，应仔细阅读本协议，如有不理解之处或其他必要，请咨询专业律师。如您不同意本协议及/或随时对其的修改，请您立即停止使用本网关提供的服务。使用本网关的任何服务即表示您已了解并完全同意本协议各项内容，包括本网关对本协议随时所做的任何修改。
                        </p>
                        <p>
                            {" "}
                            1.2
                            使用本网关提供的服务和功能，您将被视为已阅读，理解并：
                        </p>
                        <p> 1.2.1 接受本协议所有条款及条件的约束。</p>
                        <p>
                            {" "}
                            1.2.2
                            您确认您已年满21周岁或根据不同的可适用的法律规定的具有可订立合同的法定年龄，并有充分的能力接受这些条款，并订立交易，使用本网关进行数字资产交易。
                        </p>
                        <p>
                            {" "}
                            1.2.3
                            您保证交易中涉及到的属于您的数字资产均为合法取得并所有。
                        </p>
                        <p>
                            {" "}
                            1.2.4
                            您同意您为您自身的交易或非交易行为承担全部责任和任何收益或亏损。
                        </p>
                        <p>
                            {" "}
                            1.2.5
                            您同意遵守任何有关法律的规定，就税务目的而言，包括报告任何交易利润。
                        </p>
                        <p>
                            {" "}
                            1.2.6
                            本协议只是就您与我们之间达成的权利义务关系进行约束，而并不涉及本网关用户之间或其他网关和您之间因数字资产交易而产生的法律关系及法律纠纷。
                        </p>
                        <p>二、协议修订</p>
                        <p>
                            我们保留不时修订本协议、并以公示的方式进行公告、不再单独通知您的权利，变更后的协议会在本协议首页标注变更时间，一经在公布，立即自动生效。您应不时浏览及关注本协议的更新变更时间及更新内容，如您不同意相关变更，应当立即停止使用本网关服务；您继续使用本网关服务，即表示您接受并同意经修订的协议的约束。
                        </p>
                        <p>三、服务</p>
                        <p>
                            本网关只为您提供向比特股平台冲入和提取数字资产的服务，本网关并不作为买家或卖家参与买卖数字资产行为本身；本网关不提供任何国家法定货币充入和提取的相关服务。
                        </p>
                        <p> 3.1 服务内容</p>
                        <p>
                            {" "}
                            3.1.1
                            您有权通过本网关向比特股平台冲入或提取数字资产。
                        </p>
                        <p> 3.1.2 本网关承诺为您提供的其他服务。</p>
                        <p> 3.2.服务规则</p>
                        <p> 您承诺遵守下列本网关服务规则：</p>
                        <p>
                            {" "}
                            3.2.1
                            您应当遵守法律法规、规章、及政策要求的规定，保证账户中所有数字资产来源的合法性，不得在本网关或利用本网关服务从事非法或其他损害本网关或第三方权益的活动，如发送或接收任何违法、违规、侵犯他人权益的信息，发送或接收传销材料或存在其他危害的信息或言论，未经本网关授权使用或伪造本网关电子邮件题头信息等。
                        </p>
                        <p>
                            {" "}
                            3.2.2
                            您在使用本网关服务之前应充分了解比特股账号的使用常识，做好相应账号的备份及密码保存工作，对于比特股账户安全问题造成的损失，本网关不承担任何责任。
                        </p>
                        <p>
                            {" "}
                            3.2.3
                            您在使用本网关提供的服务过程中，所产生的应纳税赋，以及一切硬件、软件、服务及其它方面的费用，均由您独自承担。
                        </p>
                        <p>
                            {" "}
                            3.2.4
                            您应当遵守本网关不时发布和更新的本协议以及其他服务条款和操作规则，有权随时终止使用本网关提供的服务。
                        </p>
                        <p>四、本网关的权利和义务</p>
                        <p>
                            4.1
                            本网关有权在发现本网关上显示的任何信息存在明显错误时，对信息予以更正。
                        </p>
                        <p>
                            4.2
                            本网关保留随时修改、中止或终止本网关服务的权利，本网关行使修改或中止服务的权利不需事先告知您；本网关终止本网关一项或多项服务的，终止自本网关在网关上发布终止公告之日生效。
                        </p>
                        <p>
                            {" "}
                            4.3
                            本网关应当采取必要的技术手段和管理措施保障本网关的正常运行。
                        </p>
                        <p>五、赔偿</p>
                        <p>
                            {" "}
                            5.1
                            在任何情况下，我们对您的直接损害的赔偿责任均不会超过您从使用本网关服务产生的为期三（
                            3）个月的总费用。
                        </p>
                        <p>六、寻求禁令救济的权利</p>
                        <p>
                            我们和您均承认普通法对违约或可能违约情况的救济措施是可能是不足以弥补我们遭受的全部损失的，故非违约方有权在违约或可能违约情况下寻求禁令救济以及普通法或衡平法允许的其他所有的补救措施。
                        </p>
                        <p>七、责任限制与免责</p>
                        <p>
                            {" "}
                            7.1
                            您了解并同意，在任何情况下，我们不就以下各事项承担责任：
                        </p>
                        <p> 7.1.1 收入的损失；</p>
                        <p> 7.1.2 交易利润或合同损失；</p>
                        <p> 7.1.3 业务中断</p>
                        <p> 7.1.4 预期可节省的货币的损失；</p>
                        <p> 7.1.5 信息的损失；</p>
                        <p> 7.1.6 机会、商誉或声誉的损失；</p>
                        <p> 7.1.7 数据的损坏或损失；</p>
                        <p> 7.1.8 购买替代产品或服务的成本；</p>
                        <p>
                            {" "}
                            7.1.9
                            任何由于侵权（包括过失）、违约或其他任何原因产生的间接的、特殊的或附带性的损失或损害，不论这种损失或损害是否可以为我们合理预见；不论我们是否事先被告知存在此种损
                            失或损害的可能性。
                        </p>
                        <p>
                            {" "}
                            7.2
                            您了解并同意，我们不对因下述任一情况而导致您的任何损害赔偿承担责任：
                        </p>
                        <p>
                            {" "}
                            7.2.1
                            我们有合理的理由认为您的具体交易事项可能存在重大违法或违约情形。
                        </p>
                        <p>
                            {" "}
                            7.2.2
                            我们有合理的理由认为您在本网关的行为涉嫌违法或不当。
                        </p>
                        <p>
                            {" "}
                            7.2.3
                            通过本网关服务购买或获取任何数据、信息或进行交易等行为或替代行为产生的费用及损失。
                        </p>
                        <p> 7.2.4 您对本网关服务的误解。</p>
                        <p>
                            {" "}
                            7.2.5
                            任何非因我们的原因而引起的与本网关提供的服务有关的其它损失。
                        </p>
                        <p>
                            {" "}
                            7.3
                            我们对由于信息网络设备维护、信息网络连接故障、电脑、通讯或其他系统的故障、电力故障、天气原因、意外事故、罢工、劳动争议、暴乱、起义、骚乱、生产力或生产资料不足、火灾、洪水、风暴、爆炸、战争、银行或其他合作方原因、数字资产市场崩溃、政府行为、
                            司法或行政机关的命令、其他不在我们可控范围内或我们无能力控制的行为或第三方的原因而造成的不能服务或延迟服务，以及造成的您的损失，我们不承担任何责任。
                        </p>
                        <p>
                            {" "}
                            7.4
                            我们不能保证本网关包含的全部信息、程序、文本等完全安全，不受任何病毒、木马等恶意程序的干扰和破坏，故您登陆、使用本网关任何服务或下载及使用该下载的任何程序、信息、数据等均是您个人的决定并自行承担风险及可能产生的损失。
                        </p>
                        <p>
                            {" "}
                            7.5
                            我们对本网关中链接的任何第三方网关的任何信息、产品及业务及其他任何形式的不属于我们的主体的内容等不做任何保证和承诺，您如果使用第三方网关提供的任何服务、信息及产品等均为您个人决定且承担由此产生的一切责任。
                        </p>
                        <p>
                            {" "}
                            7.6
                            我们对于您使用本网关服务不做任何明示或暗示的保证，包括但不限于本网关提供服务的适用性、没有错误或疏漏、持续性、准确性、可靠性、适用于某一特定用途。同时，我们也不对本网关提供的服务所涉及的技术及信息的有效性、准确性、正确性、可靠性、质量、稳定、完整和及时性作出任何承诺和保证。是否登陆或使用本网关提供的服务是您个人的决定且自行承担风险及可能产生的损失。我们对于数字资产的市场、价值及价格等不做任何明示或暗示的保证，您理解并了解数字资产市场是不稳定的，价格和价值随时会大幅波动或崩盘，交易数字资产是您个人的自由选择及决定且自行承担风险及可能产生的损失。
                        </p>
                        <p>
                            {" "}
                            7.7
                            本协议中规定的我们的保证和承诺是由我们就本协议和本网关提供的服务的唯一保证和陈述，并取代任何其他途径和方式产生的保证和承诺，无论是书面的或口头的，明示的或暗示的。所有这些保证和陈述仅仅代表我们自身的承诺和保证，并不保证任何第三方遵守本协议中的保证和承诺。
                        </p>
                        <p>
                            {" "}
                            7.8
                            我们并不放弃本协议中未提及的在法律适用的最大范围内我们享有的限制、免除或抵销我们损害赔偿责任的任何权利。
                        </p>
                        <p>
                            {" "}
                            7.9
                            使用本网关服务即表示认可我们按照本协议中规定的规则进行的任何操作，产生的任何风险均由您承担。
                        </p>
                        <p>八、知识产权</p>
                        <p>
                            {" "}
                            8.1
                            本网关所包含的全部智力成果包括但不限于网关标志、数据库、网关设计、文字和图表、软件、照片、录像、音乐、声音及其前述组合，软件编译、相关源代码和软件
                            (包括小应用程序和脚本)
                            的知识产权权利均归本网关所有。您不得为商业目的复制、更改、拷贝、发送或使用前述任何材料或内容。
                        </p>
                        <p>
                            {" "}
                            8.2 本网关名称中包含的所有权利
                            (包括但不限于商誉和商标、标志) 均归公司所有。
                        </p>
                        <p>
                            {" "}
                            8.3
                            您接受本协议即视为您主动将其在本网关发表的任何形式的信息的著作权，
                            包括但不限于：复制权、发行权、出租权、展览权、表演权、放映权、广播权、信息网络传播权、摄制权、改编权、翻译权、汇编权
                            以及应当由著作权人享有的其他可转让权利无偿独家转让给本网关所有，本网关有权利就任何主体侵权单独提起诉讼并获得全部赔偿。
                            本协议效力及于您在本网关发布的任何受著作权法保护的作品内容，
                            无论该内容形成于本协议签订前还是本协议签订后。
                        </p>
                        <p>
                            {" "}
                            8.4
                            您在使用本网关服务过程中不得非法使用或处分本网关或他人的知识产权权利。您不得将已发表于本网关的信息以任何形式发布或授权其它网关（及媒体）使用。
                        </p>
                        <p>
                            {" "}
                            8.5
                            您使用本网关提供的任何服务均不视为我们向您转让任何知识产权。
                        </p>
                        <p>九、可分割性</p>
                        <p>
                            如本协议中的任何条款被任何有管辖权的法院认定为不可执行的，无效的或非法的，并不影响本协议的其余条款的效力。
                        </p>
                        <p>十、非代理关系</p>
                        <p>
                            本协议中的任何规定均不可被认为创造了、暗示了或以其他方式将我们视为您的代理人、受托人或其他代表人，本协议有其他规定的除外。
                        </p>
                        <p>十一、弃权</p>
                        <p>
                            我们或您任何一方对追究本协议约定的违约责任或其他责任的弃权并不能认定或解释为对其他违约责任的弃权；未行使任何权利或救济不得以任何方式被解释为对该等权利或救济的放弃。
                        </p>
                        <p>十二、标题</p>
                        <p>
                            所有标题仅供协议表述方便，并不用于扩大或限制该协议条款的内容或范围。
                        </p>
                        <p>十三、适用法律</p>
                        <p>
                            本协议全部内容均为根据新加坡共和国法律订立的合同，其成立、解释、内容及执行均适用新加坡共和国相关法律规定；任何因或与本协议约定的服务有关而产生的索赔或诉讼，都应依照新加坡共和国的法律进行管辖并加以解释和执行。为避免疑义，这一条款明确适用于任何针对我们的侵权索赔。任何针对我们或者是和我们有关的索赔或诉讼的管辖法院或诉讼地均在新加坡共和国。您无条件地获得在新加坡共和国法院进行诉讼和上诉的排他性的管辖权。您也无条件地同意与本协议款有关的争议或问题或产生的任何索赔请求和诉讼的发生地或法院均排他性得在新加坡共和国。不方便法院的原则不适用于根据本服务条款的选择的法院。
                        </p>
                        <p>十四、协议的生效和解释</p>
                        <p>
                            14.1
                            本协议于您点击本网关注册页面的同意注册并完成注册程序、获得本网关账号和密码时生效，对本网关和您均具有约束力。
                        </p>
                        <p>14.2 本协议的最终解释权归本网关所有。</p>
                    </div>
                );
                break;
            default:
                return (
                    <div
                        className="container"
                        ref="agreement"
                        style={{
                            height: "500px",
                            overflow: "auto",
                            position: "relative"
                        }}
                    >
                        <h2 style={{textAlign: "center"}}>Service Agreement</h2>
                        <p>
                            OBSIDIAN TECHNOLOGY CO. PTE. LTD. (hereinafter
                            referred to as the 'Company') is a company
                            incorporated under the laws in Singapore Republic,
                            GDEX (hereinafter referred to as 'GDEX' or 'the
                            Gateway') is a cryptocurrency gateway to Bitshares
                            which is operated by the company. The main access
                            point for GDEX is https://gdex.io, GDEX is a gateway
                            that provide cryptocurrency deposit and withdraw
                            service (hereinafter referred to as 'the Service')
                            to/from Bitshares. For the convenience of wording in
                            this Agreement, the Company and the Gateway are
                            referred to as 'We' or other applicable forms of
                            first person pronouns in this Agreement. All natural
                            persons or other subjects who use the Service shall
                            be users of the Gateway. For the convenience of
                            wording in this Agreement, the users are referred to
                            as 'You' or any other applicable forms of the
                            second-person pronouns. For the convenience of
                            wording in this Agreement, you and us are
                            collectively referred to as 'both parties', and
                            individually as 'one party'.
                        </p>
                        <p>Important reminder:</p>
                        <p>We hereby remind you that:</p>
                        <p>
                            1. The digital assets themselves are not offered by
                            any financial institution, corporation or the
                            Gateway;
                        </p>
                        <p>
                            2. The digital asset market is new and unconfirmed,
                            and will not necessarily expand;
                        </p>
                        <p>
                            3. Digital assets are primarily used by speculators,
                            and are used relatively less on retail and
                            commercial markets; digital asset transactions are
                            highly risky, due to the fact that they are traded
                            throughout 24-hour a day without limits on the rise
                            or fall in price, and market makers and global
                            government policies may cause major fluctuations in
                            their prices;
                        </p>
                        <p>
                            4. Digital asset transactions may be suspended or
                            prohibited at any time due to the enactment or
                            modification of national laws, regulations and
                            regulatory documents. Digital assets trading is
                            highly risky and therefore not suitable for the vast
                            majority of people. You acknowledge and understand
                            that investment in digital assets may result in
                            partial or total loss of your investment and
                            therefore you are advised to decide the amount of
                            your investment on the basis of your loss-bearing
                            capacity. You acknowledge and understand that
                            digital assets may generate derivative risks.
                            Therefore, if you have any doubt, you are advised to
                            seek assistance from a financial adviser first.
                            Furthermore, aside from the above-mentioned risks,
                            there may also be unpredictable risks. Therefore,
                            you are advised to carefully consider and use clear
                            judgment to assess your financial position and the
                            abovementioned risks before making any decisions on
                            buying and selling digital assets; any and all
                            losses arising therefrom will be borne by you and we
                            shall not be held liable in any manner whatsoever.
                        </p>
                        <p>
                            5. You understand that Bitshares is a decentralized
                            exchange based on blockchain, the basic account
                            service and the trade processing service are
                            provided by Bitshares, there are also other
                            institutions or single persons that issue assets
                            and/or provide service on Bitshares. You understand
                            that the Gateway is only used for you to
                            deposit/withdraw cryptocurrency to/from Bitshares.
                            The Gateway only undertake the due obligations for
                            the availability of own issued assets (with 'GDEX.'
                            as prefix of the name), do not undertake the due
                            obligations for the account service and the trade
                            processing service provided by Bitshares, do not
                            undertake the due obligations for availability of
                            the assets issued by other institutions or single
                            persons.{" "}
                        </p>
                        <p>
                            6. There are risk in both Internet and Bitshares,
                            include but not limit to failure for software,
                            hardware to connect to Internet, security risk for
                            Bitshares accounting system. As the availability and
                            reliability of Internet and Bitshares are not under
                            our control, we do not undertake obligations for the
                            loss caused by the risks mentioned above.
                        </p>
                        <p>
                            7.it is prohibited to use the Gateway for money
                            laundering, smuggling, bribery，if any user are
                            found relevant to these actions, the Gateway will
                            take various actions, include but not limited to
                            terminating the Service to the user, informing
                            relevant authority.
                        </p>
                    </div>
                );
        }
    }
    render() {
        let {locale} = this.props;
        let msg = this._getAgreement(locale);
        return msg;
    }
}

export default connect(GdexAgreementModal, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            settings: SettingsStore.getState().settings
        };
    }
});
